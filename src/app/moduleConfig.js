export const staffRoles = ['owner', 'admin', 'operations_manager'];
export const careRoles = [...staffRoles, 'advisor', 'practitioner'];

const text = (key, label, required = true) => ({ key, label, type: 'text', required });
const area = (key, label, required = false) => ({ key, label, type: 'textarea', required });
const number = (key, label) => ({ key, label, type: 'number' });
const date = (key, label) => ({ key, label, type: 'date' });

export const modules = {
  wellbeing: {
    title: 'Wellbeing', description: 'User-managed wellbeing plans, coaching and progress.',
    tabs: [
      { key: 'plans', label: 'Plans', table: 'wellbeing_plans', titleField: 'title', fields: [text('title','Plan title'), area('overview','Overview'), date('review_on','Review date')], memberScoped: true },
      { key: 'goals', label: 'Goals', table: 'goals', titleField: 'title', defaults: { domain: 'wellbeing' }, fields: [text('title','Goal'), area('description','Description'), number('target_value','Target'), text('unit','Unit',false), date('target_date','Target date')], memberScoped: true },
      { key: 'habits', label: 'Habits', table: 'habits', titleField: 'title', fields: [text('title','Habit'), text('cadence','Cadence'), number('target_count','Target count')], memberScoped: true },
      { key: 'checkins', label: 'Check-ins', table: 'wellbeing_checkins', titleField: 'reflection', fields: [number('mood_score','Mood (1–10)'), number('energy_score','Energy (1–10)'), area('reflection','Reflection',true)], memberScoped: true }
    ]
  },
  wealth: {
    title: 'Wealth planning', description: 'Planning, tracking and education—not trading or autonomous advice.',
    tabs: [
      { key: 'plans', label: 'Plans', table: 'wealth_plans', titleField: 'title', fields: [text('title','Plan title'), area('summary','Summary'), text('planning_horizon','Planning horizon',false), date('review_on','Review date')], memberScoped: true },
      { key: 'goals', label: 'Goals', table: 'wealth_goals', titleField: 'title', fields: [text('title','Goal'), number('target_amount','Target amount'), number('current_amount','Current amount'), text('currency','Currency'), date('target_date','Target date')], defaults: { currency: 'USD' }, memberScoped: true },
      { key: 'assets', label: 'Assets', table: 'assets', titleField: 'name', fields: [text('name','Asset name'), text('asset_type','Type'), number('estimated_value','Estimated value'), text('currency','Currency')], defaults: { currency: 'USD' }, memberScoped: true },
      { key: 'liabilities', label: 'Liabilities', table: 'liabilities', titleField: 'name', fields: [text('name','Liability'), text('liability_type','Type'), number('outstanding_balance','Balance'), number('minimum_payment','Minimum payment'), text('currency','Currency')], defaults: { currency: 'USD' }, memberScoped: true },
      { key: 'cashflow', label: 'Cash flow', table: 'cashflow_targets', titleField: 'name', fields: [text('name','Target name'), text('category','Category'), text('period','Period'), number('target_amount','Target amount'), number('actual_amount','Actual amount')], defaults: { period: 'monthly', currency: 'USD' }, memberScoped: true }
    ]
  },
  programmes: {
    title: 'Programmes', description: 'Cohorts, capacity, enrolment and milestone operations.', writeRoles: staffRoles,
    tabs: [{ key: 'programmes', label: 'Programmes', table: 'programmes', titleField: 'title', fields: [text('title','Programme title'), area('description','Description'), text('programme_type','Type'), date('starts_on','Starts'), date('ends_on','Ends'), number('capacity','Capacity')] }]
  },
  appointments: {
    title: 'Appointments', description: 'Book and coordinate advisor or practitioner sessions.',
    tabs: [{ key: 'appointments', label: 'Appointments', table: 'appointments', titleField: 'appointment_type', fields: [text('appointment_type','Appointment type'), { key:'starts_at', label:'Starts', type:'datetime-local', required:true }, { key:'ends_at', label:'Ends', type:'datetime-local', required:true }, text('host_id','Host user ID'), text('location_type','Location type')], defaults: { location_type:'video' }, memberScoped: true }]
  },
  tasks: {
    title: 'Tasks', description: 'Assigned work, deadlines and operational follow-through.',
    tabs: [{ key: 'tasks', label: 'Tasks', table: 'tasks', titleField: 'title', fields: [text('title','Task'), area('description','Description'), { key:'priority', label:'Priority', type:'select', options:['low','normal','high','urgent'] }, { key:'due_at', label:'Due', type:'datetime-local' }] }]
  },
  documents: {
    title: 'Document vault', description: 'Private document metadata and explicit access permissions.',
    tabs: [{ key: 'documents', label: 'Documents', table: 'documents', titleField: 'title', fields: [text('title','Document title'), text('category','Category'), text('storage_path','Secure storage path'), text('mime_type','File type',false), {key:'sensitivity',label:'Visibility',type:'select',options:['private','advisor','organization']}] }]
  },
  community: {
    title: 'Community', description: 'Organization community posts with policy-aware moderation.',
    tabs: [{ key: 'posts', label: 'Posts', table: 'community_posts', titleField: 'title', fields: [text('title','Post title'), area('body','Post',true)] }]
  },
  resources: {
    title: 'Resource library', description: 'Role-safe education and practical resources.', writeRoles: careRoles,
    tabs: [{ key: 'resources', label: 'Resources', table: 'resource_library_items', titleField: 'title', fields: [text('title','Title'), area('summary','Summary'), text('resource_type','Resource type'), { key:'domain',label:'Domain',type:'select',options:['wealth','wellbeing','community','operations'] }, text('content_url','Content URL',false)] }]
  },
  team: {
    title: 'Team directory', description: 'Organization memberships and authoritative roles.', readRoles: staffRoles, writeRoles: ['owner','admin'],
    tabs: [{ key: 'memberships', label: 'Members', table: 'memberships', titleField: 'role', readOnly: true, fields: [] }, { key: 'invitations', label: 'Invitations', table: 'invitations', titleField: 'email', fields: [text('email','Email'), {key:'role',label:'Role',type:'select',options:['admin','operations_manager','advisor','practitioner','member','family_delegate']}, date('expires_at','Expires')] }]
  },
  governance: {
    title: 'Governance & privacy', description: 'Consent, policy acknowledgement, access review and immutable audit history.', readRoles: staffRoles,
    tabs: [
      { key: 'consents', label: 'Consents', table: 'consents', titleField: 'consent_type', readOnly: true, fields: [] },
      { key: 'policies', label: 'Policies', table: 'policy_acknowledgements', titleField: 'policy_key', readOnly: true, fields: [] },
      { key: 'approvals', label: 'Approvals', table: 'workflow_approvals', titleField: 'workflow_type', fields: [text('workflow_type','Workflow'), text('entity_type','Entity type'), text('entity_id','Entity ID'), text('assigned_to','Assigned user',false)] },
      { key: 'audit', label: 'Audit', table: 'audit_events', titleField: 'action', readOnly: true, fields: [] }
    ]
  },
  integrations: {
    title: 'Integrations', description: 'Opt-in connection state and revocation. Secrets remain server-side.', readRoles: ['owner','admin'], writeRoles: ['owner','admin'],
    tabs: [{ key: 'connections', label: 'Connections', table: 'integration_connections', titleField: 'provider', readOnly: true, fields: [] }]
  },
  reports: {
    title: 'Reports', description: 'Operational report definitions and controlled runs.', readRoles: staffRoles, writeRoles: staffRoles,
    tabs: [{ key: 'reports', label: 'Reports', table: 'reports', titleField: 'name', fields: [text('name','Report name'), text('report_type','Report type')] }]
  },
  billing: {
    title: 'Billing', description: 'Subscription visibility. Payment details stay with the billing provider.',
    tabs: [{ key: 'billing', label: 'Subscriptions', table: 'billing_subscription_references', titleField: 'plan_key', readOnly: true, fields: [] }]
  }
};

export function canAccessModule(module, role) {
  return !module.readRoles || module.readRoles.includes(role);
}

export function canWriteModule(module, role) {
  return !module.writeRoles || module.writeRoles.includes(role);
}
