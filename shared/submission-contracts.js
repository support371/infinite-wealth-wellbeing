export const CONTACT_SUBJECTS = Object.freeze([
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

export const MEMBERSHIP_TIERS = Object.freeze([
  'Explorer',
  'Member',
  'Guardian',
]);

export const MEMBERSHIP_INTERESTS = Object.freeze([
  'Wealth & Financial Education',
  'Holistic Well-being Information',
  'Spiritual Well-being & Ministry',
  'Community & Connection',
  'All of the Above',
]);

export const SUBMISSION_LIMITS = Object.freeze({
  firstName: 80,
  lastName: 80,
  email: 254,
  subject: 100,
  message: 4000,
  tier: 40,
  interest: 100,
  introduction: 3000,
});
