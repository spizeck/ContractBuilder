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
  VStack,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'
import { useAuth } from '@core/auth/AuthContext'
import { usePermissions } from '@core/permissions/PermissionProvider'
import LogoutButton from './LogoutButton'

interface NavLinkItem {
  href: string
  label: string
}

export default function NavLinks() {
  const { user, role, loading } = useAuth()
  const { canAccessModule } = usePermissions()

  const isHotelStaffRole = role === 'hotel-staff' || role === 'hotel-manager'

  // Define link data separately from rendering
  const diveLogLinksData: NavLinkItem[] = [
    { href: '/dive-log/dives/dashboard', label: 'Dashboard' },
    { href: '/dive-log/dives/log', label: 'Log a Dive' },
    { href: '/dive-log/dives/view', label: 'View Dives' },
    { href: '/admin/guides', label: 'Manage Guides' },
    { href: '/admin/sites', label: 'Manage Sites' },
    { href: '/admin/boats', label: 'Manage Boats' },
    { href: '/admin/species', label: 'Manage Species' },
  ]

  const maintenanceLinksData: NavLinkItem[] = [
    { href: '/maintenance/dashboard', label: 'Dashboard' },
    { href: '/maintenance/logs', label: 'Maintenance Logs' },
    { href: '/maintenance/technicians', label: 'Manage Technicians' },
    { href: '/maintenance/assets', label: 'Manage Assets' },
  ]

  const contractLinksData: NavLinkItem[] = [
    { href: '/contracts', label: 'Dashboard' },
    { href: '/contracts/hotels', label: 'Manage Hotels' },
    { href: '/contracts/dive-packages', label: 'Manage Dive Packages' },
    { href: '/contracts/hotel-sheets', label: 'Hotel Price Sheets' },
  ]

  const userLinksData: NavLinkItem[] = [
    { href: '/profile', label: 'Profile' },
    { href: '/install', label: 'Install Sea Saba' },
    ...(role === 'admin' ? [{ href: '/admin/users', label: 'Manage Users' }] : []),
  ]

  // Render as MenuItems for desktop
  const renderDesktopLinks = (links: NavLinkItem[]) => (
    <>
      {links.map((link) => (
        <MenuItem
          key={link.href}
          as={NextLink}
          href={link.href}
        >
          {link.label}
        </MenuItem>
      ))}
    </>
  )

  // Render as plain Links for mobile accordion
  const renderMobileLinks = (links: NavLinkItem[]) => (
    <VStack align="stretch" spacing={0}>
      {links.map((link) => (
        <Link
          key={link.href}
          as={NextLink}
          href={link.href}
          px={4}
          py={2}
          _hover={{ bg: 'gray.100' }}
          color="teal.600"
        >
          {link.label}
        </Link>
      ))}
    </VStack>
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
        ) : user ? (
          <>
            {/* Dive Log Section */}
            {canAccessModule('diveLog') && !isHotelStaffRole && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Dive Log
                </MenuButton>
                <MenuList color="teal">{renderDesktopLinks(diveLogLinksData)}</MenuList>
              </Menu>
            )}

            {/* Maintenance Section */}
            {canAccessModule('maintenance') && !isHotelStaffRole && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Maintenance
                </MenuButton>
                <MenuList color="teal">{renderDesktopLinks(maintenanceLinksData)}</MenuList>
              </Menu>
            )}

            {/* Contracts Section */}
            {canAccessModule('contracts') && !isHotelStaffRole && (
              <Menu>
                <MenuButton as={Button} variant="link" color="white">
                  Contracts
                </MenuButton>
                <MenuList color="teal">{renderDesktopLinks(contractLinksData)}</MenuList>
              </Menu>
            )}

            {/* User Section */}
            <Menu>
              <MenuButton as={Button} variant="link" color="white">
                User
              </MenuButton>
              <MenuList color="teal">{renderDesktopLinks(userLinksData)}</MenuList>
            </Menu>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link as={NextLink} href="/install" _hover={{ textDecoration: 'underline' }}>
              Install
            </Link>
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
            <MenuItem as={NextLink} href="/install">Install Sea Saba</MenuItem>

            {loading ? (
              <Box p={4}>Loading...</Box>
            ) : user && (
              <Accordion allowToggle>
                {/* Dive Log Section */}
                {canAccessModule('diveLog') && !isHotelStaffRole && (
                  <AccordionItem border="none">
                    <AccordionButton>
                      <Box flex="1" textAlign="left">Dive Log</Box>
                    </AccordionButton>
                    <AccordionPanel pb={2}>{renderMobileLinks(diveLogLinksData)}</AccordionPanel>
                  </AccordionItem>
                )}

                {/* Maintenance Section */}
                {canAccessModule('maintenance') && !isHotelStaffRole && (
                  <AccordionItem border="none">
                    <AccordionButton>
                      <Box flex="1" textAlign="left">Maintenance</Box>
                    </AccordionButton>
                    <AccordionPanel pb={2}>{renderMobileLinks(maintenanceLinksData)}</AccordionPanel>
                  </AccordionItem>
                )}

                {/* Contracts Section */}
                {canAccessModule('contracts') && !isHotelStaffRole && (
                  <AccordionItem border="none">
                    <AccordionButton>
                      <Box flex="1" textAlign="left">Contracts</Box>
                    </AccordionButton>
                    <AccordionPanel pb={2}>{renderMobileLinks(contractLinksData)}</AccordionPanel>
                  </AccordionItem>
                )}

                {/* User Section */}
                <AccordionItem border="none">
                  <AccordionButton>
                    <Box flex="1" textAlign="left">User</Box>
                  </AccordionButton>
                  <AccordionPanel pb={2}>{renderMobileLinks(userLinksData)}</AccordionPanel>
                </AccordionItem>
              </Accordion>
            )}
            
            <LogoutButton asMenuItem/>
          </MenuList>
        </Menu>
      </Flex>
    </>
  )
}
