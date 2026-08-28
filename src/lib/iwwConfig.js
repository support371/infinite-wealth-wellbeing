export const IWW_ROLES = [
  'owner',
  'admin',
  'operations_manager',
  'advisor',
  'practitioner',
  'member',
  'family_delegate',
];

export const STAFF_ROLES = ['owner', 'admin', 'operations_manager', 'advisor', 'practitioner'];
export const ORG_ADMIN_ROLES = ['owner', 'admin'];

export const roleHome = {
  owner: '/app/overview',
  admin: '/app/operations',
  operations_manager: '/app/operations',
  advisor: '/app/wealth',
  practitioner: '/app/wellbeing',
  member: '/app/overview',
  family_delegate: '/app/delegated',
};

export const navigation = [
  { id: 'overview', label: 'Overview', href: '/app/overview', roles: IWW_ROLES },
  { id: 'wellbeing', label: 'Wellbeing', href: '/app/wellbeing', roles: IWW_ROLES },
  { id: 'wealth', label: 'Wealth planning', href: '/app/wealth', roles: IWW_ROLES },
  { id: 'goals', label: 'Goals & habits', href: '/app/goals', roles: IWW_ROLES },
  { id: 'programmes', label: 'Programmes', href: '/app/programmes', roles: IWW_ROLES },
  { id: 'appointments', label: 'Appointments', href: '/app/appointments', roles: IWW_ROLES },
  { id: 'messages', label: 'Messages', href: '/app/messages', roles: IWW_ROLES },
  { id: 'documents', label: 'Documents', href: '/app/documents', roles: IWW_ROLES },
  { id: 'tasks', label: 'Tasks', href: '/app/tasks', roles: IWW_ROLES },
  { id: 'resources', label: 'Resources', href: '/app/resources', roles: IWW_ROLES },
  { id: 'community', label: 'Community', href: '/app/community', roles: ['owner','admin','operations_manager','advisor','practitioner','member'] },
  { id: 'assistant', label: 'IWW Guide', href: '/app/assistant', roles: IWW_ROLES },
  { id: 'delegated', label: 'Delegated access', href: '/app/delegated', roles: ['family_delegate'] },
  { id: 'members', label: 'Members', href: '/app/members', roles: ['owner','admin','operations_manager','advisor','practitioner'] },
  { id: 'team', label: 'Team', href: '/app/team', roles: ['owner', 'admin'] },
  { id: 'operations', label: 'Operations', href: '/app/operations', roles: ['owner', 'admin', 'operations_manager'] },
  { id: 'reports', label: 'Reports', href: '/app/reports', roles: ['owner', 'admin', 'operations_manager', 'advisor', 'practitioner'] },
  { id: 'governance', label: 'Governance', href: '/app/governance', roles: ['owner', 'admin'] },
  { id: 'integrations', label: 'Integrations', href: '/app/integrations', roles: ['owner', 'admin'] },
  { id: 'billing', label: 'Billing', href: '/app/billing', roles: ['owner', 'admin', 'member'] },
  { id: 'settings', label: 'Settings', href: '/app/settings', roles: IWW_ROLES },
];

export function canRoleAccess(role, item) {
  return Boolean(role && item.roles.includes(role));
}

export const moduleDefinitions = {
  goals: {
    title: 'Goals', description: 'Create and track personal wellbeing goals.', table: 'goals', memberScoped: true,
    fields: [
      { name: 'title', label: 'Goal', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['wellbeing', 'life', 'relationship', 'learning', 'other'], required: true },
      { name: 'target_date', label: 'Target date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'paused', 'completed'], defaultValue: 'active' },
    ],
  },
  habits: {
    title: 'Habits', description: 'Track routines and repeatable practices.', table: 'habits', memberScoped: true,
    fields: [
      { name: 'name', label: 'Habit', type: 'text', required: true },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['daily', 'weekly', 'custom'], defaultValue: 'daily' },
      { name: 'target_count', label: 'Target count', type: 'number', defaultValue: 1 },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
  },
  wellbeingPlans: {
    title: 'Wellbeing plans', description: 'Member-owned coaching and wellbeing planning records.', table: 'wellbeing_plans', memberScoped: true,
    fields: [
      { name: 'title', label: 'Plan title', type: 'text', required: true },
      { name: 'summary', label: 'Focus and intentions', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft','active','paused','completed'], defaultValue: 'active' },
    ],
  },
  assessments: {
    title: 'Self-assessments', description: 'Structured self-reflection records without diagnostic interpretation.', table: 'assessments', memberScoped: true,
    fields: [
      { name: 'title', label: 'Assessment title', type: 'text', required: true },
      { name: 'assessment_type', label: 'Type', type: 'select', options: ['wellbeing_reflection','programme_baseline','life_balance','other'], required: true },
      { name: 'member_summary', label: 'Reflection summary', type: 'textarea' },
    ],
  },
  coachingSessions: {
    title: 'Coaching sessions', description: 'Session records and member-facing summaries.', table: 'coaching_sessions', memberScoped: true,
    fields: [
      { name: 'title', label: 'Session title', type: 'text', required: true },
      { name: 'session_at', label: 'Session date', type: 'datetime-local' },
      { name: 'member_summary', label: 'Member summary', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled','completed','cancelled'], defaultValue: 'scheduled' },
    ],
  },
  appointments: {
    title: 'Appointments', description: 'Schedule and review approved member sessions.', table: 'appointments', memberScoped: true,
    fields: [
      { name: 'title', label: 'Appointment', type: 'text', required: true },
      { name: 'appointment_type', label: 'Type', type: 'select', options: ['coaching', 'advisor_review', 'wellbeing_session', 'orientation', 'other'], required: true },
      { name: 'starts_at', label: 'Start', type: 'datetime-local', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['requested', 'confirmed', 'completed', 'cancelled'], defaultValue: 'requested' },
    ],
  },
  wealthPlans: {
    title: 'Wealth plans', description: 'User-entered planning objectives and review status.', table: 'wealth_plans', memberScoped: true,
    fields: [
      { name: 'title', label: 'Plan title', type: 'text', required: true },
      { name: 'summary', label: 'Planning summary', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft','active','review','completed'], defaultValue: 'active' },
    ],
  },
  wealthGoals: {
    title: 'Wealth goals', description: 'Track user-entered financial planning targets.', table: 'wealth_goals', memberScoped: true,
    fields: [
      { name: 'title', label: 'Goal', type: 'text', required: true },
      { name: 'target_amount', label: 'Target amount', type: 'number' },
      { name: 'current_amount', label: 'Current amount', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
      { name: 'target_date', label: 'Target date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active','paused','completed'], defaultValue: 'active' },
    ],
  },
  assets: {
    title: 'Assets', description: 'User-entered planning records for personal financial visibility.', table: 'assets', memberScoped: true,
    fields: [
      { name: 'name', label: 'Asset', type: 'text', required: true },
      { name: 'asset_type', label: 'Type', type: 'select', options: ['cash', 'property', 'retirement', 'investment', 'business', 'other'], required: true },
      { name: 'estimated_value', label: 'Estimated value', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    ],
  },
  liabilities: {
    title: 'Liabilities', description: 'User-entered debt and liability planning records.', table: 'liabilities', memberScoped: true,
    fields: [
      { name: 'name', label: 'Liability', type: 'text', required: true },
      { name: 'liability_type', label: 'Type', type: 'select', options: ['mortgage', 'loan', 'credit_card', 'tax', 'other'], required: true },
      { name: 'balance', label: 'Balance', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    ],
  },
  cashflowTargets: {
    title: 'Cash-flow targets', description: 'Planning targets entered by the member, not bank-account automation.', table: 'cashflow_targets', memberScoped: true,
    fields: [
      { name: 'name', label: 'Target name', type: 'text', required: true },
      { name: 'period', label: 'Period', type: 'select', options: ['monthly','quarterly','annual'], defaultValue: 'monthly' },
      { name: 'target_income', label: 'Income target', type: 'number' },
      { name: 'target_saving', label: 'Saving target', type: 'number' },
      { name: 'target_spending', label: 'Spending target', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    ],
  },
  adviserTasks: {
    title: 'Adviser tasks', description: 'Planning follow-ups coordinated with an assigned adviser.', table: 'adviser_tasks', memberScoped: true,
    fields: [
      { name: 'title', label: 'Task', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'due_at', label: 'Due', type: 'datetime-local' },
      { name: 'status', label: 'Status', type: 'select', options: ['open','in_progress','completed','cancelled'], defaultValue: 'open' },
    ],
  },
  wealthReviews: {
    title: 'Wealth reviews', description: 'Recorded adviser-supported planning review cycles.', table: 'wealth_reviews', memberScoped: true,
    fields: [
      { name: 'reviewed_at', label: 'Review date', type: 'datetime-local', required: true },
      { name: 'summary', label: 'Review summary', type: 'textarea' },
      { name: 'next_steps', label: 'Next steps', type: 'textarea' },
    ],
  },
  tasks: {
    title: 'Tasks', description: 'Coordinate follow-up work and member actions.', table: 'tasks', memberScoped: false,
    fields: [
      { name: 'title', label: 'Task', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'due_at', label: 'Due', type: 'datetime-local' },
      { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'blocked', 'completed'], defaultValue: 'open' },
    ],
  },
};
