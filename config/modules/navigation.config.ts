export const NAVIGATION = [
  { id: 'dashboard', icon: 'Activity', roles: ['owner', 'manager', 'employee', 'watchman'] },
  { id: 'stock', icon: 'Warehouse', roles: ['owner', 'manager'] },
  { id: 'inward', icon: 'ArrowDownToLine', roles: ['owner', 'manager'] },
  { id: 'batches', icon: 'Boxes', roles: ['owner', 'manager', 'employee'] },
  { id: 'workers', icon: 'Users', roles: ['owner', 'manager', 'watchman'] },
  { id: 'attendance', icon: 'UserCheck', roles: ['owner', 'manager', 'employee', 'watchman'] },
  { id: 'payroll', icon: 'WalletCards', roles: ['owner', 'manager', 'employee'] },
  { id: 'reports', icon: 'FileText', roles: ['owner', 'manager'] },
  { id: 'logbook', icon: 'ClipboardList', roles: ['owner'] },
  { id: 'settings', icon: 'Settings', roles: ['owner'] },
] as const;
