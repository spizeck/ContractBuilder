import {
  Box,
  Heading,
  Text,
  VStack,
  List,
  ListItem,
  Divider
} from '@chakra-ui/react'

export default function Home () {
  return (
    <Box p={5} maxW='4xl' mx='auto'>
      <Heading as='h1' size='xl' mb={6} textAlign='center'>
        Sea Saba Business App
      </Heading>

      <Text fontSize='lg' mb={6} textAlign='center'>
        Welcome to the Sea Saba Business App. This platform streamlines our
        daily operations, including managing dive group contracts and logging
        dives for our boats and guests.
      </Text>

      <VStack align='start' spacing={6}>
        {/* Contracts Section */}
        <Box w='100%'>
          <Heading as='h2' size='md' mb={2}>
            Contract Builder
          </Heading>
          <List spacing={3} fontSize='md'>
            <ListItem>
              • Navigate to <b>Contracts</b> to create a new group contract or
              review/edit existing ones.
            </ListItem>
            <ListItem>
              • Use <b>Hotels</b> to view and manage hotel data, room types, and
              seasonal rates.
            </ListItem>
            <ListItem>
              • Visit <b>Dive Packages</b> to review and update available diving
              options for contracts.
            </ListItem>
            <ListItem>
              • Totals are calculated automatically, including FOC (Free of
              Charge) rules and commissions.
            </ListItem>
            <ListItem>
              • When complete, save the contract and generate a PDF for client
              confirmation.
            </ListItem>
          </List>
        </Box>

        <Divider />

        {/* Dive Log Section */}
        <Box w='100%'>
          <Heading as='h2' size='md' mb={2}>
            Dive Log
          </Heading>
          <List spacing={3} fontSize='md'>
            <ListItem>
              • Navigate to <b>Dive Log</b> to record daily dives for each boat.
            </ListItem>
            <ListItem>
              • Track dive sites, guides, customers, and conditions for each
              trip.
            </ListItem>
            <ListItem>
              • Species sightings can be added for research and guest interest.
            </ListItem>
            <ListItem>
              • Dive numbers are automatically incremented to keep accurate
              records.
            </ListItem>
            <ListItem>
              • Logs provide a permanent record for safety, marine park
              reporting, and customer history.
            </ListItem>
          </List>
        </Box>
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
