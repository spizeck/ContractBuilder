export type UserRole = 'admin' | 'hotel-manager' | 'hotel-staff' | 'employee' | 'viewer'

export type PermissionLevel = 'view' | 'create' | 'edit' | null

export interface ModulePermissions {
  contracts: PermissionLevel
  diveLog: PermissionLevel
  maintenance: PermissionLevel
  operations: PermissionLevel
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
  employee: 1,
  viewer: 0,
} as const

export const DEFAULT_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  admin: {
    contracts: 'edit',
    diveLog: 'edit',
    maintenance: 'edit',
    operations: 'edit',
  },
  'hotel-manager': {
    contracts: 'edit',
    diveLog: 'create',
    maintenance: 'view',
    operations: 'create',
  },
  'hotel-staff': {
    contracts: 'view',
    diveLog: 'create',
    maintenance: 'view',
    operations: 'create',
  },
  employee: {
    contracts: null,
    diveLog: 'create',
    maintenance: 'view',
    operations: 'create',
  },
  viewer: {
    contracts: null,
    diveLog: 'view',
    maintenance: null,
    operations: null,
  },
}
