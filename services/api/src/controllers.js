import { accepted, failure } from './httpResponses.js';
import { parseBody, inquirySchema, membershipApplicationSchema, practitionerApplicationSchema, complianceRecordSchema } from './validation.js';
import { repositories } from './repositories.js';

function writeWorkflowAndAudit({ workflow, entityType, entityId, action, actorId = null, payload = {} }) {
  const workflowEvent = repositories.workflowEvents.create({ workflow, entityType, entityId, toState: 'submitted', payload });
  const auditLog = repositories.auditLogs.create({ actorId, action, targetType: entityType, targetId: entityId, metadata: { workflowEventId: workflowEvent.id } });
  return { workflowEvent, auditLog };
}

export function createInquiry(req, res) {
  const parsed = parseBody(inquirySchema, req.body);
  if (!parsed.ok) return failure(res, { code: 'invalid_inquiry', details: parsed.errors });
  const record = repositories.inquiries.create({ ...parsed.data, status: 'new' });
  const events = writeWorkflowAndAudit({ workflow: 'inquiry', entityType: 'Inquiry', entityId: record.id, action: 'inquiry.create', actorId: req.user?.id, payload: { inquiryType: record.inquiryType } });
  return accepted(res, { code: 'inquiry.accepted', data: record, meta: events });
}

export function createMembershipApplication(req, res) {
  const parsed = parseBody(membershipApplicationSchema, req.body);
  if (!parsed.ok) return failure(res, { code: 'invalid_membership_application', details: parsed.errors });
  const record = repositories.membershipApplications.create({ ...parsed.data, status: 'submitted' });
  const events = writeWorkflowAndAudit({ workflow: 'membership', entityType: 'MembershipApplication', entityId: record.id, action: 'membership.application.create', actorId: req.user?.id });
  return accepted(res, { code: 'membership_application.accepted', data: record, meta: events });
}

export function createPractitionerApplication(req, res) {
  const parsed = parseBody(practitionerApplicationSchema, req.body);
  if (!parsed.ok) return failure(res, { code: 'invalid_practitioner_application', details: parsed.errors });
  const record = repositories.practitionerApplications.create({ ...parsed.data, status: 'submitted' });
  const events = writeWorkflowAndAudit({ workflow: 'practitioner', entityType: 'PractitionerApplication', entityId: record.id, action: 'practitioner.application.create', actorId: req.user?.id });
  return accepted(res, { code: 'practitioner_application.accepted', data: record, meta: events });
}

export function createComplianceRecord(req, res) {
  const parsed = parseBody(complianceRecordSchema, req.body);
  if (!parsed.ok) return failure(res, { code: 'invalid_compliance_record', details: parsed.errors });
  const record = repositories.complianceRecords.create({ ...parsed.data, status: 'pending_review' });
  const events = writeWorkflowAndAudit({ workflow: 'compliance', entityType: 'ComplianceRecord', entityId: record.id, action: 'compliance.record.create', actorId: req.user?.id });
  return accepted(res, { code: 'compliance_record.accepted', data: record, meta: events });
}
