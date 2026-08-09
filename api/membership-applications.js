import { MEMBERSHIP_INTERESTS, MEMBERSHIP_TIERS, SUBMISSION_LIMITS } from '../shared/submission-contracts.js';
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

const ALLOWED_TIERS = new Set(MEMBERSHIP_TIERS);
const ALLOWED_INTERESTS = new Set(MEMBERSHIP_INTERESTS);

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (handleOptions(req, res)) return;
  if (!requirePost(req, res)) return;

  const body = getBody(req);
  if (!body) return res.status(400).json({ error: 'invalid_json' });

  if (cleanText(body.companyWebsite, 200)) {
    return res.status(202).json({ status: 'accepted' });
  }

  const firstName = cleanText(body.firstName, SUBMISSION_LIMITS.firstName);
  const lastName = cleanText(body.lastName, SUBMISSION_LIMITS.lastName);
  const email = cleanText(body.email, SUBMISSION_LIMITS.email).toLowerCase();
  const tier = cleanText(body.tier, SUBMISSION_LIMITS.tier);
  const interest = cleanText(body.interest, SUBMISSION_LIMITS.interest);
  const introduction = cleanMultiline(body.introduction, SUBMISSION_LIMITS.introduction);
  const consent = body.consent === true;

  const errors = {};
  if (!firstName) errors.firstName = 'required';
  if (!lastName) errors.lastName = 'required';
  if (!isValidEmail(email)) errors.email = 'invalid';
  if (!ALLOWED_TIERS.has(tier)) errors.tier = 'invalid';
  if (!ALLOWED_INTERESTS.has(interest)) errors.interest = 'invalid';
  if (introduction.length > 0 && introduction.length < 10) errors.introduction = 'too_short';
  if (!consent) errors.consent = 'required';

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'validation_failed', fields: errors });
  }

  const payload = {
    type: 'membership.application.received',
    reference: `IWW-MEM-${Date.now()}`,
    person: { firstName, lastName, email },
    requestedTier: tier,
    primaryInterest: interest,
    introduction,
    consent: {
      applicationProcessing: true,
      contactPermission: true,
    },
    metadata: requestMetadata(req),
  };

  const delivered = await forwardWebhook(
    process.env.MEMBERSHIP_WEBHOOK_URL,
    payload,
    process.env.WORKFLOW_WEBHOOK_SECRET,
  );

  if (!delivered.ok) {
    return res.status(delivered.status).json({
      error: delivered.error,
      message: 'The membership workflow is not available. Please contact the organization directly.',
    });
  }

  return res.status(202).json({
    status: 'accepted',
    reference: payload.reference,
  });
}
