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
  isManagerOrAbove: () => boolean
  isStaffOrAbove: () => boolean
  canAccessModule: (module: keyof ModulePermissions) => boolean
}

const PermissionContext = createContext<PermissionContextType>({
  userPermissions: null,
  hasPermission: () => false,
  isAdmin: () => false,
  isHotelStaff: () => false,
  isManagerOrAbove: () => false,
  isStaffOrAbove: () => false,
  canAccessModule: () => false,
})

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('=== PERMISSION PROVIDER DEBUG ===');
    console.log('User:', user?.email);
    
    if (!user) {
      console.log('No user - setting permissions to null');
      setUserPermissions(null);
      setLoading(false);
      return;
    }

    console.log('Setting up Firestore listener for user:', user.uid);
    
    // Set up real-time listener for user document
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      console.log('=== FIRESTORE SNAPSHOT ===');
      console.log('Doc exists:', docSnapshot.exists());
      
      try {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          console.log('User data from Firestore:', userData);
          
          // Map legacy roles to new role system
          let mappedRole: UserRole = 'viewer';
          if (userData.role === 'admin') mappedRole = 'admin';
          else if (userData.role === 'employee') mappedRole = 'employee';
          else if (userData.role === 'manager' || userData.role === 'hotel-manager') mappedRole = 'hotel-manager';
          else if (userData.role === 'hotel-staff') mappedRole = 'hotel-staff';
          else if (userData.role === 'viewer') mappedRole = 'viewer';
          
          console.log('Mapped role:', mappedRole);
          console.log('User permissions from Firestore:', userData.permissions);
          
          // Use actual permissions from Firestore, or fall back to defaults for legacy users
          const permissions = userData.permissions || DEFAULT_PERMISSIONS[mappedRole];
          console.log('Final permissions:', permissions);
          
          const finalPermissions = {
            role: mappedRole,
            permissions,
            archived: userData.archived || false
          };
          
          console.log('Setting userPermissions:', finalPermissions);
          setUserPermissions(finalPermissions);
        } else {
          console.log('User document does not exist - using defaults');
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
      console.error('=== FIRESTORE LISTENER ERROR ===');
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
  const isManagerOrAbove = (): boolean => userPermissions?.role === 'admin' || userPermissions?.role === 'hotel-manager'
  const isStaffOrAbove = (): boolean => userPermissions?.role === 'admin' || userPermissions?.role === 'hotel-manager' || userPermissions?.role === 'hotel-staff'

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
      isManagerOrAbove,
      isStaffOrAbove,
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
