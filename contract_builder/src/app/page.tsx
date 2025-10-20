import {Box, Divider, Heading, Link, List, ListItem, Text, VStack} from '@chakra-ui/react'
import NextLink from "next/link";

export default function Home() {
  return (
    <Box p={5} maxW='4xl' mx='auto'>
      <Heading as='h1' size='xl' mb={6} textAlign='left'>
        Sea Saba Business App
      </Heading>

      <Text fontSize='lg' mb={6} textAlign='left'>
        Welcome to the Sea Saba Business App. This platform streamlines our
        daily operations, including managing dive group contracts and logging
        dives for our boats and guests.
      </Text>

      <VStack align='start' spacing={6}>

        {/* Dive Log Section */}
        <Box w="100%">
          <Heading as="h2" size="md" mb={2}>
            Dive Log
          </Heading>
          <List spacing={3} fontSize="md">
            <ListItem>
              • Go to{" "}
              <Link color="teal.500" as={NextLink} href="/dives/log">
                <b>Dive Log</b>
              </Link>{" "}
              to record daily dives for each boat.
            </ListItem>
            <ListItem>
              • Track dive sites, guides, customers, and ocean conditions for every trip.
            </ListItem>
            <ListItem>
              • Add species sightings to support research and enhance guest experiences.
            </ListItem>
            <ListItem>
              • Logs create a permanent record used for quality checks, marine park
              reporting, and customer history.
            </ListItem>
            <ListItem>
              • Previously recorded dives can be{" "}
              <Link color="teal.500" as={NextLink} href="/dives/view">
                <b>viewed here</b>
              </Link>
              .
            </ListItem>
          </List>
        </Box>

        {/* Contracts Section */}
        <Box w="100%">
          <Heading as="h2" size="md" mb={2}>
            Contract Builder
          </Heading>
          <List spacing={3} fontSize="md">
            <ListItem>
              • Access{" "}
              <Link color="teal.500" as={NextLink} href="/contracts">
                <b>Contracts</b>
              </Link>{" "}
              to create a new group contract or review/edit existing ones.
            </ListItem>
            <ListItem>
              • Manage hotel data, room types, and seasonal rates under{" "}
              <Link color="teal.500" as={NextLink} href="/hotels">
                <b>Hotels</b>
              </Link>
              .
            </ListItem>
            <ListItem>
              • Review and update available diving options for group bookings in{" "}
              <Link color="teal.500" as={NextLink} href="/dive-packages">
                <b>Dive Packages</b>
              </Link>
              .
            </ListItem>
            <ListItem>
              • Totals are calculated automatically, applying Free of Charge (FOC) rules
              and commission rates.
            </ListItem>
            <ListItem>
              • Save contracts and generate a professional PDF for client confirmation
              with one click.
            </ListItem>
            <ListItem color="gray.500" fontStyle="italic">
              Note: Contract Builder features are only available to authorized users
              (managers and admins).
            </ListItem>
          </List>
        </Box>

        {/* Maintenance Section */}
        <Box w="100%">
          <Heading as="h2" size="md" mb={2}>
            Maintenance
          </Heading>
          <List spacing={3} fontSize="md">
            <ListItem>
              • Manage shop assets and personnel in the{" "}
              <Link color="teal.500" as={NextLink} href="/maintenance/technicians">
                <b>Maintenance Section</b>
              </Link>
              .
            </ListItem>
            <ListItem>
              • Keep track of certified technicians and their roles.
            </ListItem>
            <ListItem>
              • Manage and track company assets like vehicles and equipment.
            </ListItem>
            <ListItem color="gray.500" fontStyle="italic">
              Note: Maintenance features are only available to authorized users
              (managers and admins).
            </ListItem>
          </List>
        </Box>

        <Divider/>

      </VStack>

      <Box mt={8}>
        <Text fontSize='sm' color='gray.500' textAlign='center'>
          Note: This application is still in development. Some features may be
          incomplete or subject to change.
        </Text>
      </Box>
    </Box>
  )
}
