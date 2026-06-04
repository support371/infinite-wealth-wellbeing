import { z } from 'zod';

export const inquirySchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().min(1)
});

export const membershipApplicationSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  membershipPath: z.string().optional(),
  interests: z.array(z.string()).optional(),
  codeOfConductAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional()
});

export const practitionerApplicationSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  specialty: z.string().min(1),
  credentials: z.string().optional(),
  yearsExperience: z.number().optional(),
  motivation: z.string().min(1)
});

export const complianceRecordSchema = z.object({
  title: z.string().min(1),
  recordType: z.string().min(1),
  issuingBody: z.string().optional(),
  documentReference: z.string().optional(),
  effectiveDate: z.string().optional(),
  reviewDate: z.string().optional(),
  publicVisibility: z.boolean().optional(),
  approvalNotes: z.string().optional()
});

export function parseBody(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  return { ok: true, data: parsed.data };
}
