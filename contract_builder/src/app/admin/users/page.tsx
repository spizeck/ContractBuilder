"use client";

import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Select,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Checkbox,
  Alert,
  AlertIcon,
  Divider,
  Flex,
} from "@chakra-ui/react";
import ProtectedRoute from "@/components/shared/LayoutComponents/ProtectedRoute";
import { usePermissions } from "@/context/PermissionProvider";
import { UserRole, PermissionLevel, ModulePermissions, DEFAULT_PERMISSIONS } from "@/types/permissions";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
  id: string;
  email: string;
  name: string;
  role: string; // Existing role from Firestore (e.g., "manager")
  permissions?: ModulePermissions; // New permissions field (optional for backward compatibility)
  archived?: boolean; // Track if user is archived
  hotelId?: string; // Hotel assignment for hotel staff
  createdAt?: any;
  preferences?: any;
  units?: any;
}

export default function UserManagementPage() {
  const { isAdmin } = usePermissions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);

  // Form state for editing user
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editPermissions, setEditPermissions] = useState<ModulePermissions>(DEFAULT_PERMISSIONS.employee);
  const [editHotelId, setEditHotelId] = useState<string>('');

  useEffect(() => {
    loadUsers();
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const hotelsQuery = query(collection(db, 'hotels'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(hotelsQuery);
      
      const hotelsData: any[] = [];
      querySnapshot.forEach((doc) => {
        hotelsData.push({
          id: doc.id,
          name: doc.data().name || 'Unnamed Hotel',
        });
      });
      
      setHotels(hotelsData);
    } catch (err) {
      console.error('Error loading hotels:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as Omit<User, 'id'>;
        
        // Map existing roles to new role system for backward compatibility
        let mappedRole: UserRole = 'employee';
        if (userData.role === 'admin') mappedRole = 'admin';
        else if (userData.role === 'manager' || userData.role === 'hotel-manager') mappedRole = 'hotel-staff';
        else if (userData.role === 'hotel-staff') mappedRole = 'hotel-staff';
        else if (userData.role === 'viewer') mappedRole = 'employee';
        
        usersData.push({
          id: doc.id,
          email: userData.email,
          name: userData.name || userData.email,
          role: userData.role, // Keep original role for display
          permissions: userData.permissions, // Use existing permissions if available
          hotelId: userData.hotelId, // Include hotel assignment
          archived: userData.archived || false, // Include archived status
          createdAt: userData.createdAt,
          preferences: userData.preferences,
          units: userData.units,
        });
      });
      
      // Sort users: active users first, archived users last
      const sortedUsers = usersData.sort((a, b) => {
        // If one is archived and the other isn't, archived goes last
        if ((a.archived || false) !== (b.archived || false)) {
          return (a.archived || false) ? 1 : -1;
        }
        // Otherwise maintain original order (by createdAt)
        return 0;
      });
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    
    // Map existing role to new role system for editing
    let mappedRole: UserRole = 'employee';
    if (user.role === 'admin') mappedRole = 'admin';
    else if (user.role === 'manager' || user.role === 'hotel-manager') mappedRole = 'hotel-staff';
    else if (user.role === 'hotel-staff') mappedRole = 'hotel-staff';
    else if (user.role === 'viewer') mappedRole = 'employee';
    
    setEditRole(mappedRole);
    setEditPermissions(user.permissions || { ...DEFAULT_PERMISSIONS.employee });
    setEditHotelId(user.hotelId || '');
    onOpen();
  };

  const handleRoleChange = (role: UserRole) => {
    setEditRole(role);
    if (role === 'admin') {
      // Admin gets all permissions
      setEditPermissions(DEFAULT_PERMISSIONS.admin);
    } else if (role === 'hotel-staff') {
      // Hotel staff gets default permissions
      setEditPermissions(DEFAULT_PERMISSIONS['hotel-staff']);
    }
    // Employee keeps custom permissions
  };

  const handlePermissionChange = (module: keyof ModulePermissions, level: PermissionLevel) => {
    setEditPermissions(prev => ({
      ...prev,
      [module]: level,
    }));
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      // Map new role back to Firestore format if needed
      let firestoreRole: string = editRole;
      if (editRole === 'hotel-staff' && selectedUser.role === 'manager') {
        // Keep original "manager" role if it existed
        firestoreRole = 'manager';
      }
      
      const updateData: any = {
        role: firestoreRole,
        permissions: editPermissions,
      };
      
      // Add hotelId for hotel staff roles
      if (editRole === 'hotel-staff' && editHotelId) {
        updateData.hotelId = editHotelId;
      } else if (editRole !== 'hotel-staff') {
        updateData.hotelId = null; // Remove hotelId for non-hotel staff
      }
      
      await updateDoc(userRef, updateData);

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              role: firestoreRole, 
              permissions: editPermissions,
              hotelId: (editRole === 'hotel-staff' && editHotelId) ? editHotelId : undefined
            }
          : user
      ));

      onClose();
    } catch (err) {
      setError('Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  const handleArchiveUser = async (user: User) => {
    try {
      console.log('Starting archive operation for user:', user.email, 'Current archived status:', user.archived);
      
      const userRef = doc(db, 'users', user.id);
      console.log('User document path:', userRef.path);
      
      if (user.archived) {
        // Unarchive user - restore default permissions based on role
        console.log('Unarchiving user...');
        let defaultPermissions = DEFAULT_PERMISSIONS.employee;
        if (user.role === 'admin') defaultPermissions = DEFAULT_PERMISSIONS.admin;
        else if (user.role === 'manager' || user.role === 'hotel-manager' || user.role === 'hotel-staff') {
          defaultPermissions = DEFAULT_PERMISSIONS['hotel-staff'];
        }
        
        const updateData = {
          archived: false,
          permissions: defaultPermissions,
        };
        console.log('Update data for unarchive:', updateData);
        
        await updateDoc(userRef, updateData);
        console.log('Unarchive completed successfully');
        
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, archived: false, permissions: defaultPermissions }
            : u
        ));
      } else {
        // Archive user - disable all permissions
        console.log('Archiving user...');
        const disabledPermissions: ModulePermissions = {
          contracts: null,
          diveLog: null,
          maintenance: null,
        };
        
        const updateData = {
          archived: true,
          permissions: disabledPermissions,
        };
        console.log('Update data for archive:', updateData);
        
        await updateDoc(userRef, updateData);
        console.log('Archive completed successfully');
        
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, archived: true, permissions: disabledPermissions }
            : u
        ));
      }
    } catch (err) {
      console.error('Error in archive operation:', err);
      setError('Failed to archive/unarchive user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager':
      case 'hotel-manager':
      case 'hotel-staff': return 'yellow';
      case 'viewer':
      case 'employee': return 'blue';
      default: return 'gray';
    }
  };

  const getDisplayPermission = (user: User, module: keyof ModulePermissions) => {
    // Admin users always have edit permissions
    if (user.role === 'admin') {
      return 'edit';
    }
    // Archived users have no permissions
    if (user.archived) {
      return 'None';
    }
    // Show actual permission or None if not set
    return user.permissions?.[module] || 'None';
  };

  const getPermissionBadgeColor = (level: PermissionLevel | undefined | null) => {
    switch (level) {
      case 'edit': return 'green';
      case 'create': return 'yellow';
      case 'view': return 'blue';
      default: return 'gray';
    }
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute adminOnly>
        <Box p={8}>
          <Alert status="error">
            <AlertIcon />
            Admin access required
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <Box p={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>User Management</Heading>
            <Text color="textPrimary">
              Manage user roles and module permissions
            </Text>
          </Box>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" overflowX="auto">
            <Table variant="simple" minW="800px">
              <Thead>
                <Tr>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Role</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Contracts</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Dive Log</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Maintenance</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id} opacity={user.archived ? 0.6 : 1}>
                    <Td>{user.email}</Td>
                    <Td>
                      {user.archived ? (
                        <Badge colorScheme="red">Archived</Badge>
                      ) : (
                        <Badge colorScheme="green">Active</Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Badge colorScheme={getPermissionBadgeColor(getDisplayPermission(user, 'contracts') as PermissionLevel)}>
                        {getDisplayPermission(user, 'contracts')}
                      </Badge>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Badge colorScheme={getPermissionBadgeColor(getDisplayPermission(user, 'diveLog') as PermissionLevel)}>
                        {getDisplayPermission(user, 'diveLog')}
                      </Badge>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Badge colorScheme={getPermissionBadgeColor(getDisplayPermission(user, 'maintenance') as PermissionLevel)}>
                        {getDisplayPermission(user, 'maintenance')}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleEditUser(user)}
                          isDisabled={user.archived}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme={user.archived ? "green" : "red"}
                          onClick={() => handleArchiveUser(user)}
                        >
                          {user.archived ? 'Unarchive' : 'Archive'}
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {/* Edit User Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit User Permissions</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>User Email</FormLabel>
                    <Text fontWeight="bold">{selectedUser?.email}</Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Role</FormLabel>
                    <Select value={editRole} onChange={(e) => handleRoleChange(e.target.value as UserRole)}>
                      <option value="employee">Employee</option>
                      <option value="hotel-staff">Hotel Staff</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </FormControl>

                  {/* Hotel Assignment for Hotel Staff */}
                  {editRole === 'hotel-staff' && (
                    <FormControl>
                      <FormLabel>Hotel Assignment</FormLabel>
                      <Select 
                        value={editHotelId} 
                        onChange={(e) => setEditHotelId(e.target.value)}
                        placeholder="Select a hotel"
                      >
                        {hotels.map((hotel) => (
                          <option key={hotel.id} value={hotel.id}>
                            {hotel.name}
                          </option>
                        ))}
                      </Select>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        Hotel staff will only have access to their assigned hotel's data
                      </Text>
                    </FormControl>
                  )}

                  <Divider />

                  <Text fontWeight="bold">Module Permissions</Text>
                  {editRole === 'admin' && (
                    <Alert status="info">
                      <AlertIcon />
                      Admin users have access to all modules with edit permissions
                    </Alert>
                  )}
                  
                  {editRole === 'hotel-staff' && (
                    <Alert status="info">
                      <AlertIcon />
                      Hotel staff have default view permissions for all modules
                    </Alert>
                  )}
                  
                  {editRole === 'employee' && (
                    <VStack spacing={4} align="stretch">
                      {Object.entries(editPermissions).map(([module, level]) => (
                        <FormControl key={module}>
                          <FormLabel>
                            {module.charAt(0).toUpperCase() + module.slice(1).replace(/([A-Z])/g, ' $1')}
                          </FormLabel>
                          <Select 
                            value={level || ''} 
                            onChange={(e) => handlePermissionChange(module as keyof ModulePermissions, e.target.value as PermissionLevel || null)}
                          >
                            <option value="">No Access</option>
                            <option value="view">View</option>
                            <option value="create">Create</option>
                            <option value="edit">Edit</option>
                          </Select>
                        </FormControl>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSaveUser}>
                  Save Changes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Box>
    </ProtectedRoute>
  );
}
