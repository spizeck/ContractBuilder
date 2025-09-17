import { Box, Heading, Text, VStack, List, ListItem } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box p={5} maxW="4xl" mx="auto">
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Sea Saba Contract Builder
      </Heading>

      <Text fontSize="lg" mb={6} textAlign="center">
        Welcome to the Sea Saba Contract Builder. This tool streamlines the
        process of creating, viewing, and managing dive group contracts with
        our partner hotels.
      </Text>

      <VStack align="start" spacing={4}>
        <Heading as="h2" size="md">
          How to Use
        </Heading>
        <List spacing={3} fontSize="md">
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
            • As you enter contract details, totals will be calculated
            automatically, including FOC (Free of Charge) rules and commissions.
          </ListItem>
          <ListItem>
            • When complete, save the contract and generate a PDF for client
            confirmation.
          </ListItem>
        </List>
      </VStack>

      <Box mt={8}>
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Note: This application is still in development. Some features may be
          incomplete or subject to change.
        </Text>
      </Box>
    </Box>
  );
}
