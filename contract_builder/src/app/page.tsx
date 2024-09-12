import { Box, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Sea Saba Contract Builder
      </Heading>
      <Text fontSize="lg" textAlign="center" mb={4}>
        This application is currently under development. Instructions on how to
        use the app will be added here once the development is complete.
      </Text>
    </Box>
  );
}
