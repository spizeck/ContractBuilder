'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { 
  UserRole, 
  PermissionLevel, 
  ModulePermissions, 
  UserPermissions,
  DEFAULT_PERMISSIONS,
  ROLE_HIERARCHY 
} from '@/types/permissions'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface PermissionContextType {
  userPermissions: UserPermissions | null
  hasPermission: (module: keyof ModulePermissions, level: PermissionLevel) => boolean
  isAdmin: () => boolean
  isHotelStaff: () => boolean
  isEmployee: () => boolean
  isViewer: () => boolean
  canAccessModule: (module: keyof ModulePermissions) => boolean
}

const PermissionContext = createContext<PermissionContextType | null>(null)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setUserPermissions(null);
      setLoading(false);
      return;
    }
    
    // Set up real-time listener for user document
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      try {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          
          // Map legacy roles to new role system
          let mappedRole: UserRole = 'viewer';
          if (userData.role === 'admin') mappedRole = 'admin';
          else if (userData.role === 'manager' || userData.role === 'hotel-manager') mappedRole = 'hotel-manager';
          else if (userData.role === 'hotel-staff') mappedRole = 'hotel-staff';
          else if (userData.role === 'employee') mappedRole = 'employee';
          else if (userData.role === 'viewer') mappedRole = 'viewer';
          
          // Merge stored permissions with role defaults so null module values fall back
          const roleDefaults = DEFAULT_PERMISSIONS[mappedRole];
          const stored = userData.permissions || {};
          const permissions: ModulePermissions = {
            contracts: stored.contracts != null ? stored.contracts : roleDefaults.contracts,
            diveLog: stored.diveLog != null ? stored.diveLog : roleDefaults.diveLog,
            maintenance: stored.maintenance != null ? stored.maintenance : roleDefaults.maintenance,
          };
          
          const finalPermissions = {
            role: mappedRole,
            permissions,
            archived: userData.archived || false
          };
          
          setUserPermissions(finalPermissions);
        } else {
          // User document doesn't exist, use default permissions
          setUserPermissions({
            role: 'viewer',
            permissions: DEFAULT_PERMISSIONS.viewer
          });
        }
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setUserPermissions({
          role: 'viewer',
          permissions: DEFAULT_PERMISSIONS.viewer
        });
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error setting up user listener:', error);
      setUserPermissions({
        role: 'viewer',
        permissions: DEFAULT_PERMISSIONS.viewer
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const hasPermission = (module: keyof ModulePermissions, level: PermissionLevel): boolean => {
    if (!userPermissions || !level) return false

    // Archived users have no permissions
    if (userPermissions.archived) return false

    // Admin has all permissions
    if (userPermissions.role === 'admin') return true

    const userLevel = userPermissions.permissions[module]
    if (!userLevel) return false

    // Permission hierarchy: edit > create > view
    const levelHierarchy = { edit: 3, create: 2, view: 1 }
    const userLevelValue = levelHierarchy[userLevel]
    const requiredLevelValue = levelHierarchy[level]

    return userLevelValue >= requiredLevelValue
  }

  const isAdmin = (): boolean => userPermissions?.role === 'admin'
  const isHotelStaff = (): boolean => userPermissions?.role === 'hotel-staff'
  const isEmployee = (): boolean => userPermissions?.role === 'employee'
  const isViewer = (): boolean => userPermissions?.role === 'viewer'

  const canAccessModule = (module: keyof ModulePermissions): boolean => {
    if (!userPermissions) return false

    // Archived users cannot access any modules
    if (userPermissions.archived) return false

    // Admin can access all modules
    if (userPermissions.role === 'admin') return true

    const permission = userPermissions.permissions[module]
    return permission !== null && permission !== undefined
  }

  return (
    <PermissionContext.Provider value={{
      userPermissions,
      hasPermission,
      isAdmin,
      isHotelStaff,
      isEmployee,
      isViewer,
      canAccessModule,
    }}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}
