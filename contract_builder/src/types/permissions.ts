export type UserRole = 'admin' | 'employee' | 'hotel-manager' | 'hotel-staff' | 'viewer'

export type PermissionLevel = 'view' | 'create' | 'edit' | null

export interface ModulePermissions {
  contracts: PermissionLevel
  diveLog: PermissionLevel
  maintenance: PermissionLevel
  operations: PermissionLevel
  // Add more modules as needed
}

export interface UserPermissions {
  role: UserRole
  permissions: ModulePermissions
  archived?: boolean // Track if user is archived
}

export const MODULES = {
  CONTRACTS: 'contracts',
  DIVE_LOG: 'diveLog',
  MAINTENANCE: 'maintenance',
  OPERATIONS: 'operations',
} as const

export const PERMISSION_LEVELS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
} as const

export const ROLE_HIERARCHY = {
  admin: 4,
  'hotel-manager': 3,
  'hotel-staff': 2,
  viewer: 1,
} as const

export const DEFAULT_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  admin: {
    contracts: 'edit',
    diveLog: 'edit',
    maintenance: 'edit',
    operations: 'edit',
  },
  employee: {
    contracts: null,
    diveLog: null,
    maintenance: null,
    operations: null,
  },
  'hotel-manager': {
    contracts: 'edit',
    diveLog: 'view',
    maintenance: 'view',
    operations: 'edit',
  },
  'hotel-staff': {
    contracts: 'view',
    diveLog: 'view',
    maintenance: 'view',
    operations: 'view',
  },
  viewer: {
    contracts: null,
    diveLog: null,
    maintenance: null,
    operations: null,
  },
}
