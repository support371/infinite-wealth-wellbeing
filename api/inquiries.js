import { CONTACT_SUBJECTS, SUBMISSION_LIMITS } from '../shared/submission-contracts.js';
import {
  applySecurityHeaders,
  cleanMultiline,
  cleanText,
  forwardWebhook,
  getBody,
  handleOptions,
  isValidEmail,
  requestMetadata,
  requireAllowedOrigin,
  requirePost,
} from './_lib/http.js';
import {
  persistInquiry,
  readIdempotencyKey,
  recordNotificationDelivery,
} from './_lib/persistence.js';

const ALLOWED_SUBJECTS = new Set(CONTACT_SUBJECTS);

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (handleOptions(req, res)) return;
  if (!requireAllowedOrigin(req, res)) return;
  if (!requirePost(req, res)) return;

  const body = getBody(req);
  if (!body) return res.status(400).json({ error: 'invalid_json' });

  if (cleanText(body.companyWebsite, 200)) {
    return res.status(202).json({ status: 'accepted' });
  }

  const firstName = cleanText(body.firstName, SUBMISSION_LIMITS.firstName);
  const lastName = cleanText(body.lastName, SUBMISSION_LIMITS.lastName);
  const email = cleanText(body.email, SUBMISSION_LIMITS.email).toLowerCase();
  const subject = cleanText(body.subject, SUBMISSION_LIMITS.subject);
  const message = cleanMultiline(body.message, SUBMISSION_LIMITS.message);
  const consent = body.consent === true;

  const errors = {};
  if (!firstName) errors.firstName = 'required';
  if (!lastName) errors.lastName = 'required';
  if (!isValidEmail(email)) errors.email = 'invalid';
  if (!ALLOWED_SUBJECTS.has(subject)) errors.subject = 'invalid';
  if (message.length < 10) errors.message = 'too_short';
  if (!consent) errors.consent = 'required';

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'validation_failed', fields: errors });
  }

  const idempotencyKey = readIdempotencyKey(req);
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'idempotency_key_required' });
  }

  const metadata = requestMetadata(req);
  const person = { firstName, lastName, email };
  const persisted = await persistInquiry({
    idempotencyKey,
    person,
    subject,
    message,
    metadata,
  });

  if (!persisted.ok) {
    return res.status(persisted.status).json({
      error: persisted.error,
      message: 'The submission could not be stored safely. Please try again later.',
    });
  }

  const stored = Array.isArray(persisted.data) ? persisted.data[0] : persisted.data;
  if (!stored?.reference || !stored?.submissionId) {
    return res.status(502).json({
      error: 'persistence_invalid_response',
      message: 'The submission store returned an invalid acknowledgement.',
    });
  }

  const payload = {
    type: 'inquiry.received',
    reference: stored.reference,
    submissionId: stored.submissionId,
    person,
    subject,
    message,
    consent: {
      submissionProcessing: true,
      contactPermission: true,
    },
    metadata,
  };

  const delivered = await forwardWebhook(
    process.env.INQUIRY_WEBHOOK_URL,
    payload,
    process.env.WORKFLOW_WEBHOOK_SECRET,
  );

  await recordNotificationDelivery({
    submissionKind: 'inquiry',
    submissionId: stored.submissionId,
    delivered,
  });

  return res.status(202).json({
    status: 'accepted',
    reference: stored.reference,
    staffNotification: delivered.ok ? 'sent' : 'degraded',
  });
}
