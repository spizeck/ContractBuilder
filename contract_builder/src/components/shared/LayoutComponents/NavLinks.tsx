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
import { useAuth } from '@/context/AuthContext'
import LogoutButton from './LogoutButton'

export default function NavLinks() {
  const { user, role } = useAuth()

  // All the links (to reuse for desktop + mobile)
  const contractLinks = (
    <>
      <MenuItem as={NextLink} href="/contracts">Contracts</MenuItem>
      <MenuItem as={NextLink} href="/hotels">Hotels</MenuItem>
      <MenuItem as={NextLink} href="/dive-packages">Dive Packages</MenuItem>
    </>
  )

  const hotelStaffLinks = (
    <>
      <MenuItem as={NextLink} href="/hotel-staff">Dashboard</MenuItem>
      <MenuItem as={NextLink} href="/hotel-staff/hotel">Hotel Details</MenuItem>
      <MenuItem as={NextLink} href="/hotel-staff/contracts">Contracts</MenuItem>
    </>
  )

  const diveLogLinks = (
    <>
      <MenuItem as={NextLink} href="/dives/dashboard">Dashboard</MenuItem>
      <MenuItem as={NextLink} href="/dives/view">View Dives</MenuItem>
      <MenuItem as={NextLink} href="/dives/log">Log a Dive</MenuItem>
      {(role === 'admin' || role === 'hotel-manager') && (
        <>
          <MenuItem as={NextLink} href="/admin/guides">Manage Guides</MenuItem>
          <MenuItem as={NextLink} href="/admin/sites">Manage Sites</MenuItem>
          <MenuItem as={NextLink} href="/admin/boats">Manage Boats</MenuItem>
          <MenuItem as={NextLink} href="/admin/species">Manage Species</MenuItem>
        </>
      )}
    </>
  )

  const maintenanceLinks = (
    <>
      <MenuItem as={NextLink} href="/maintenance/dashboard">Dashboard</MenuItem>
      <MenuItem as={NextLink} href="/maintenance/technicians">Technicians</MenuItem>
      <MenuItem as={NextLink} href="/maintenance/assets">Manage Assets</MenuItem>
      <MenuItem as={NextLink} href="/maintenance/logs">Maintenance Logs</MenuItem>
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

        {user && (
          <>
            {(role === 'hotel-staff' || role === 'hotel-manager') ? (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Hotel Staff
                </MenuButton>
                <MenuList color="teal">{hotelStaffLinks}</MenuList>
              </Menu>
            ) : (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Contracts
                </MenuButton>
                <MenuList color="teal">{contractLinks}</MenuList>
              </Menu>
            )}

            {/* Dive Log Section - Admin only */}
            {role === 'admin' && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Dive Log
                </MenuButton>
                <MenuList color="teal">{diveLogLinks}</MenuList>
              </Menu>
            )}

            {/* Maintenance Section - Admin only */}
            {role === 'admin' && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Maintenance
                </MenuButton>
                <MenuList color="teal">{maintenanceLinks}</MenuList>
              </Menu>
            )}

            <Link as={NextLink} href="/profile" _hover={{ textDecoration: 'underline' }}>
              Profile
            </Link>
            <LogoutButton />
          </>
        )}

        {!user && (
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

            {user && (
              <Box>
                <Accordion allowToggle>
                  {/* Hotel Staff Section */}
                  {(role === 'hotel-staff' || role === 'hotel-manager') && (
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">Hotel Staff</Box>
                      </AccordionButton>
                      <AccordionPanel pb={2}>{hotelStaffLinks}</AccordionPanel>
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

                  {/* Dive Log Section - Admin only */}
                  {role === 'admin' && (
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">Dive Log</Box>
                      </AccordionButton>
                      <AccordionPanel pb={2}>{diveLogLinks}</AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Maintenance Section - Admin only */}
                  {role === 'admin' && (
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">Maintenance</Box>
                      </AccordionButton>
                      <AccordionPanel pb={2}>{maintenanceLinks}</AccordionPanel>
                    </AccordionItem>
                  )}
                </Accordion>

            )

          <MenuItem as={NextLink} href="/profile">Profile</MenuItem>
          <LogoutButton asMenuItem/>
        </Box>
      )}

      {!user && (
        <>
          <MenuItem as={NextLink} href="/login">Login</MenuItem>
          <MenuItem as={NextLink} href="/register">Register</MenuItem>
        </>
      )}
    </MenuList>
  </Menu>
</Flex>

    </>
  )
}
