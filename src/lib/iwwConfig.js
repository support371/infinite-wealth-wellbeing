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
  { id: 'delegated', label: 'Delegated access', href: '/app/delegated', roles: ['family_delegate'] },
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
    title: 'Goals',
    description: 'Create and track personal wellbeing goals.',
    table: 'goals',
    memberScoped: true,
    fields: [
      { name: 'title', label: 'Goal', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['wellbeing', 'life', 'relationship', 'learning', 'other'], required: true },
      { name: 'target_date', label: 'Target date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'paused', 'completed'], defaultValue: 'active' },
    ],
  },
  habits: {
    title: 'Habits',
    description: 'Track routines and repeatable practices.',
    table: 'habits',
    memberScoped: true,
    fields: [
      { name: 'name', label: 'Habit', type: 'text', required: true },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['daily', 'weekly', 'custom'], defaultValue: 'daily' },
      { name: 'target_count', label: 'Target count', type: 'number', defaultValue: 1 },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
  },
  appointments: {
    title: 'Appointments',
    description: 'Schedule and review approved member sessions.',
    table: 'appointments',
    memberScoped: true,
    fields: [
      { name: 'title', label: 'Appointment', type: 'text', required: true },
      { name: 'appointment_type', label: 'Type', type: 'select', options: ['coaching', 'advisor_review', 'wellbeing_session', 'orientation', 'other'], required: true },
      { name: 'starts_at', label: 'Start', type: 'datetime-local', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['requested', 'confirmed', 'completed', 'cancelled'], defaultValue: 'requested' },
    ],
  },
  assets: {
    title: 'Assets',
    description: 'User-entered planning records for personal financial visibility.',
    table: 'assets',
    memberScoped: true,
    fields: [
      { name: 'name', label: 'Asset', type: 'text', required: true },
      { name: 'asset_type', label: 'Type', type: 'select', options: ['cash', 'property', 'retirement', 'investment', 'business', 'other'], required: true },
      { name: 'estimated_value', label: 'Estimated value', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    ],
  },
  liabilities: {
    title: 'Liabilities',
    description: 'User-entered debt and liability planning records.',
    table: 'liabilities',
    memberScoped: true,
    fields: [
      { name: 'name', label: 'Liability', type: 'text', required: true },
      { name: 'liability_type', label: 'Type', type: 'select', options: ['mortgage', 'loan', 'credit_card', 'tax', 'other'], required: true },
      { name: 'balance', label: 'Balance', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    ],
  },
  tasks: {
    title: 'Tasks',
    description: 'Coordinate follow-up work and member actions.',
    table: 'tasks',
    memberScoped: false,
    fields: [
      { name: 'title', label: 'Task', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'due_at', label: 'Due', type: 'datetime-local' },
      { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'blocked', 'completed'], defaultValue: 'open' },
    ],
  },
};
