import {
  applySecurityHeaders,
  cleanMultiline,
  cleanText,
  forwardWebhook,
  getBody,
  handleOptions,
  isValidEmail,
  requestMetadata,
  requirePost,
} from './_lib/http.js';

const ALLOWED_SUBJECTS = new Set([
  'General Inquiry',
  'Wealth Education',
  'Membership Questions',
  'Prayer Request',
  'Well-being Service Information',
  'Ministry Partnership',
  'Retreat Information',
  'Donation Enquiry',
  'Technical Support',
]);

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (handleOptions(req, res)) return;
  if (!requirePost(req, res)) return;

  const body = getBody(req);
  if (!body) return res.status(400).json({ error: 'invalid_json' });

  if (cleanText(body.companyWebsite, 200)) {
    return res.status(202).json({ status: 'accepted' });
  }

  const firstName = cleanText(body.firstName, 80);
  const lastName = cleanText(body.lastName, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  const subject = cleanText(body.subject, 100);
  const message = cleanMultiline(body.message, 4000);
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

  const payload = {
    type: 'inquiry.received',
    reference: `IWW-INQ-${Date.now()}`,
    person: { firstName, lastName, email },
    subject,
    message,
    consent: {
      submissionProcessing: true,
      contactPermission: true,
    },
    metadata: requestMetadata(req),
  };

  const delivered = await forwardWebhook(
    process.env.INQUIRY_WEBHOOK_URL,
    payload,
    process.env.WORKFLOW_WEBHOOK_SECRET,
  );

  if (!delivered.ok) {
    return res.status(delivered.status).json({
      error: delivered.error,
      message: 'The inquiry workflow is not available. Please contact the organization directly.',
    });
  }

  return res.status(202).json({
    status: 'accepted',
    reference: payload.reference,
  });
}
