import { Box, Button, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Sea Saba Contract Builder
      </Heading>
      <Text fontSize="lg" textAlign="center" mb={4}>
        Welcome to the test page! Everything is set up correctly.
      </Text>
      <Button colorScheme="teal" size="lg" display="block" mx="auto">
        Test Button
      </Button>
    </Box>
  );
}
