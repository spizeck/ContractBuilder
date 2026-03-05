'use client'

import {
  Button,
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  IconButton,
  Accordion,
  Box,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'
import { useAuth } from '@core/auth/AuthContext'
import { usePermissions } from '@core/permissions/PermissionProvider'
import LogoutButton from './LogoutButton'

export default function NavLinks() {
  const { user, role, loading } = useAuth()
  const { canAccessModule } = usePermissions()

  // All the links (to reuse for desktop + mobile)
  const diveLogLinks = (
    <>
      <MenuItem as={NextLink} href="/app/dive-log/dives/dashboard">Dashboard</MenuItem>
      <MenuItem as={NextLink} href="/app/dive-log/dives/log">Log a Dive</MenuItem>
      <MenuItem as={NextLink} href="/app/dive-log/dives/view">View Dives</MenuItem>
      <MenuItem as={NextLink} href="/app/admin/guides">Manage Guides</MenuItem>
      <MenuItem as={NextLink} href="/app/admin/sites">Manage Sites</MenuItem>
      <MenuItem as={NextLink} href="/app/admin/boats">Manage Boats</MenuItem>
      <MenuItem as={NextLink} href="/app/admin/species">Manage Species</MenuItem>
    </>
  )

  const maintenanceLinks = (
    <>
      <MenuItem as={NextLink} href="/app/maintenance/dashboard">Dashboard</MenuItem>
      <MenuItem as={NextLink} href="/app/maintenance/logs">Maintenance Logs</MenuItem>
      <MenuItem as={NextLink} href="/app/maintenance/technicians">Manage Technicians</MenuItem>
      <MenuItem as={NextLink} href="/app/maintenance/assets">Manage Assets</MenuItem>
    </>
  )

  const contractLinks = (
    <>
      <MenuItem as={NextLink} href="/app/contracts">Dashboard</MenuItem>
      <MenuItem as={NextLink} href="/app/contracts/hotels">Manage Hotels</MenuItem>
      <MenuItem as={NextLink} href="/app/contracts/dive-packages">Manage Dive Packages</MenuItem>
    </>
  )

  const userLinks = (
    <>
      <MenuItem as={NextLink} href="/profile">Profile</MenuItem>
      {role === 'admin' && (
        <MenuItem as={NextLink} href="/app/admin/users">Manage Users</MenuItem>
      )}
    </>
  )

  return (
    <>
      {/* Desktop Nav */}
      <Flex
        as="nav"
        gap={6}
        align="center"
        display={{ base: 'none', md: 'flex' }}
      >
        <Link as={NextLink} href="/" _hover={{ textDecoration: 'underline' }}>
          Home
        </Link>

        {loading ? (
          <Box>Loading...</Box>
        ) : user && (
          <>
            {/* Dive Log Section */}
            {canAccessModule('diveLog') && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Dive Log
                </MenuButton>
                <MenuList color="teal">{diveLogLinks}</MenuList>
              </Menu>
            )}

            {/* Maintenance Section */}
            {canAccessModule('maintenance') && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Maintenance
                </MenuButton>
                <MenuList color="teal">{maintenanceLinks}</MenuList>
              </Menu>
            )}

            {/* Contracts Section */}
            {!(role === 'hotel-staff' || role === 'hotel-manager') && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Contracts
                </MenuButton>
                <MenuList color="teal">{contractLinks}</MenuList>
              </Menu>
            )}

            {/* User Section */}
            <Menu>
              <MenuButton as={Button} variant="link" color="white">
                User
              </MenuButton>
              <MenuList color="teal">{userLinks}</MenuList>
            </Menu>
            <LogoutButton />
          </>
        )}

        {loading ? (
          <Box>...</Box>
        ) : !user && (
          <>
            <Link as={NextLink} href="/login" _hover={{ textDecoration: 'underline' }}>
              Login
            </Link>
            <Link as={NextLink} href="/register" _hover={{ textDecoration: 'underline' }}>
              Register
            </Link>
          </>
        )}
      </Flex>

      {/* Mobile Nav */}
      <Flex display={{ base: 'flex', md: 'none' }}>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Open Menu"
            icon={<HamburgerIcon />}
            variant="outline"
            color="white"
            border="none"
          />
          <MenuList color="teal" p={0}>
            <MenuItem as={NextLink} href="/">Home</MenuItem>

            {loading ? (
              <Box>...</Box>
            ) : user && (
              <Box>
                <Accordion allowToggle>
                  {/* Dive Log Section */}
                  {canAccessModule('diveLog') && (
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">Dive Log</Box>
                      </AccordionButton>
                      <AccordionPanel pb={2}>{diveLogLinks}</AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Maintenance Section */}
                  {canAccessModule('maintenance') && (
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">Maintenance</Box>
                      </AccordionButton>
                      <AccordionPanel pb={2}>{maintenanceLinks}</AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Contracts Section */}
                  {!(role === 'hotel-staff' || role === 'hotel-manager') && (
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">Contracts</Box>
                      </AccordionButton>
                      <AccordionPanel pb={2}>{contractLinks}</AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* User Section */}
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">User</Box>
                    </AccordionButton>
                    <AccordionPanel pb={2}>{userLinks}</AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </Box>
            )}
            
            <LogoutButton asMenuItem/>
          </MenuList>
        </Menu>
      </Flex>
    </>
  )
}
