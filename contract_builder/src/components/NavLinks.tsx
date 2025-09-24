'use client'

import {Button, Flex, Link, Menu, MenuButton, MenuItem, MenuList, } from '@chakra-ui/react'
// import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'
import {useAuth} from '@/context/AuthContext'
import LogoutButton from '@/components/LogoutButton'

export default function NavLinks() {
  const {user, role} = useAuth()

  return (
    <Flex as="nav" gap={6} align="center">
      {/* Home always visible */}
      <Link as={NextLink} href="/" _hover={{textDecoration: 'underline'}}>
        Home
      </Link>

      {user && (
        <>
          {/* Contracts Dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              variant="link"
              color="white"
              _hover={{textDecoration: 'underline'}}
            >
              Contracts
            </MenuButton>
            <MenuList color={"teal"}>
              <MenuItem as={NextLink} href="/contracts">
                Contracts
              </MenuItem>
              <MenuItem as={NextLink} href="/hotels">
                Hotels
              </MenuItem>
              <MenuItem as={NextLink} href="/dive-packages">
                Dive Packages
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Dive Log Dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              variant="link"
              color="white"
              _hover={{textDecoration: 'underline'}}
            >
              Dive Log
            </MenuButton>
            <MenuList color={"teal"}>
              <MenuItem as={NextLink} href="/dives/view">
                View Dives
              </MenuItem>
              <MenuItem as={NextLink} href="/dives/log">
                Log a Dive
              </MenuItem>
              {(role === 'admin' || role === 'manager') && (
                <>
                  <MenuItem as={NextLink} href="/admin/guides">
                    Manage Guides
                  </MenuItem>
                  <MenuItem as={NextLink} href="/admin/sites">
                    Manage Sites
                  </MenuItem>
                  <MenuItem as={NextLink} href="/admin/boats">
                    Manage Boats
                  </MenuItem>
                  <MenuItem as={NextLink} href="/admin/species">
                    Manage Species
                  </MenuItem>
                </>
              )}
            </MenuList>
          </Menu>

          {/* Profile + Logout */}
          <Link
            as={NextLink}
            href="/profile"
            _hover={{textDecoration: 'underline'}}
          >
            Profile
          </Link>
          <LogoutButton/>
        </>
      )}

      {!user && (
        <>
          <Link as={NextLink} href="/login" _hover={{textDecoration: 'underline'}}>
            Login
          </Link>
          <Link as={NextLink} href="/register" _hover={{textDecoration: 'underline'}}>
            Register
          </Link>
        </>
      )}
    </Flex>
  )
}

//todo: Make pretty