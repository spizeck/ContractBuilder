"use client";

import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  Link,
  List,
  ListItem,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import {
  FiFileText,
  FiBarChart2,
  FiTool,
  FiUsers,
  FiHome,
  FiActivity,
  FiCalendar,
  FiDollarSign,
} from "react-icons/fi";
import { TbScubaMask } from "react-icons/tb";

export default function Home() {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const staffBoxBg = useColorModeValue("green.50", "green.900");
  const staffBoxBorder = useColorModeValue("green.200", "green.700");
  const staffHeadingColor = useColorModeValue("green.700", "green.200");
  const adminBoxBg = useColorModeValue("blue.50", "blue.900");
  const adminBoxBorder = useColorModeValue("blue.200", "blue.700");
  const adminHeadingColor = useColorModeValue("blue.700", "blue.200");

  return (
    <Container maxW="7xl" py={8}>
      {/* Header Section */}
      <VStack spacing={4} mb={12} textAlign="center">
        <Heading as="h1" size="2xl" fontWeight="bold">
          Sea Saba Business App
        </Heading>
        <Text fontSize="xl" color="gray.600" maxW="3xl">
          Your comprehensive platform for managing dive operations, contracts,
          maintenance, and business analytics. Streamline daily operations and
          enhance customer experiences with our integrated management system.
        </Text>
      </VStack>

      {/* Quick Actions */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={12}>
        <Card
          bg={cardBg}
          border="1px"
          borderColor={cardBorder}
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <CardBody>
            <VStack spacing={4}>
              <Icon as={TbScubaMask} boxSize={12} color="teal.500" />
              <Stack spacing={2} textAlign="center">
                <Heading size="md">Dive Log</Heading>
                <Text fontSize="sm" color="gray.600">
                  Log your dives
                </Text>
              </Stack>
              <Button
                as={NextLink}
                href="/dives/log"
                colorScheme="teal"
                variant="solid"
                w="full"
              >
                Log Dive
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card
          bg={cardBg}
          border="1px"
          borderColor={cardBorder}
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <CardBody>
            <VStack spacing={4}>
              <Icon as={FiFileText} boxSize={12} color="blue.500" />
              <Stack spacing={2} textAlign="center">
                <Heading size="md">Contracts</Heading>
                <Text fontSize="sm" color="gray.600">
                  Create and manage group contracts
                </Text>
              </Stack>
              <Button
                as={NextLink}
                href="/contracts"
                colorScheme="blue"
                variant="solid"
                w="full"
              >
                Manage Contracts
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card
          bg={cardBg}
          border="1px"
          borderColor={cardBorder}
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <CardBody>
            <VStack spacing={4}>
              <Icon as={FiBarChart2} boxSize={12} color="purple.500" />
              <Stack spacing={2} textAlign="center">
                <Heading size="md">Analytics</Heading>
                <Text fontSize="sm" color="gray.600">
                  View operational insights and reports
                </Text>
              </Stack>
              <Button
                as={NextLink}
                href="/dives/dashboard"
                colorScheme="purple"
                variant="solid"
                w="full"
              >
                View Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card
          bg={cardBg}
          border="1px"
          borderColor={cardBorder}
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <CardBody>
            <VStack spacing={4}>
              <Icon as={FiTool} boxSize={12} color="orange.500" />
              <Stack spacing={2} textAlign="center">
                <Heading size="md">Maintenance</Heading>
                <Text fontSize="sm" color="gray.600">
                  Track equipment service and assets
                </Text>
              </Stack>
              <Button
                as={NextLink}
                href="/maintenance/dashboard"
                colorScheme="orange"
                variant="solid"
                w="full"
              >
                Maintenance Hub
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Detailed Features Section */}
      <VStack spacing={8} mb={12}>
        <Heading as="h2" size="xl">
          Platform Features
        </Heading>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Dive Operations */}
          <VStack align="start" spacing={4}>
            <HStack>
              <Icon as={FiActivity} color="teal.500" boxSize={6} />
              <Heading as="h3" size="lg">
                Dive Operations
              </Heading>
            </HStack>
            <List spacing={3}>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/dives/log"
                  color="teal.500"
                  fontWeight="bold"
                >
                  Dive Logging
                </Link>{" "}
                - Record daily dives for each boat with detailed information
              </ListItem>
              <ListItem>
                Track dive sites, guides, customers, and ocean conditions
              </ListItem>
              <ListItem>
                Log species sightings to support research and enhance guest
                experiences
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/dives/view"
                  color="teal.500"
                  fontWeight="bold"
                >
                  View Dive History
                </Link>{" "}
                - Access complete dive records and analytics
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/dives/dashboard"
                  color="teal.500"
                  fontWeight="bold"
                >
                  Dive Dashboard
                </Link>{" "}
                - Comprehensive statistics and operational insights
              </ListItem>
            </List>
          </VStack>

          {/* Contract Management */}
          <VStack align="start" spacing={4}>
            <HStack>
              <Icon as={FiFileText} color="blue.500" boxSize={6} />
              <Heading as="h3" size="lg">
                Contract Management
              </Heading>
            </HStack>
            <List spacing={3}>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/contracts"
                  color="blue.500"
                  fontWeight="bold"
                >
                  Contract Builder
                </Link>{" "}
                - Create group contracts with automated calculations
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/hotels"
                  color="blue.500"
                  fontWeight="bold"
                >
                  Hotel Management
                </Link>{" "}
                - Configure room types, seasonal rates, and policies
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/dive-packages"
                  color="blue.500"
                  fontWeight="bold"
                >
                  Dive Packages
                </Link>{" "}
                - Manage diving options and pricing for groups
              </ListItem>
              <ListItem>
                Automatic FOC rules and commission calculations
              </ListItem>
              <ListItem>
                Generate professional PDFs for client confirmation
              </ListItem>
            </List>
          </VStack>

          {/* Maintenance & Assets */}
          <VStack align="start" spacing={4}>
            <HStack>
              <Icon as={FiTool} color="orange.500" boxSize={6} />
              <Heading as="h3" size="lg">
                Maintenance & Assets
              </Heading>
            </HStack>
            <List spacing={3}>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/maintenance/dashboard"
                  color="orange.500"
                  fontWeight="bold"
                >
                  Maintenance Dashboard
                </Link>{" "}
                - Overview of all maintenance activities
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/maintenance/logs"
                  color="orange.500"
                  fontWeight="bold"
                >
                  Service Logs
                </Link>{" "}
                - Track maintenance history and upcoming services
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/maintenance/assets"
                  color="orange.500"
                  fontWeight="bold"
                >
                  Asset Management
                </Link>{" "}
                - Manage company equipment and vehicles
              </ListItem>
              <ListItem>
                <Link
                  as={NextLink}
                  href="/maintenance/technicians"
                  color="orange.500"
                  fontWeight="bold"
                >
                  Technician Management
                </Link>{" "}
                - Organize maintenance staff and roles
              </ListItem>
            </List>
          </VStack>

          {/* Business Intelligence */}
          <VStack align="start" spacing={4}>
            <HStack>
              <Icon as={FiBarChart2} color="purple.500" boxSize={6} />
              <Heading as="h3" size="lg">
                Business Intelligence
              </Heading>
            </HStack>
            <List spacing={3}>
              <ListItem>
                Dive activity monitoring and performance metrics
              </ListItem>
              <ListItem>
                Site utilization analysis and repetition patterns
              </ListItem>
              <ListItem>
                Seasonal wildlife tracking and temperature trends
              </ListItem>
              <ListItem>
                7-day operational matrices and detailed reporting
              </ListItem>
              <ListItem>
                Data-driven insights for business optimization
              </ListItem>
            </List>
          </VStack>
        </SimpleGrid>
      </VStack>

      <Divider my={8} />

      {/* Access Information */}
      <VStack spacing={6} mb={8}>
        <Heading as="h3" size="lg">
          Access & Permissions
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
          <Box
            p={4}
            bg={staffBoxBg}
            border="1px"
            borderColor={staffBoxBorder}
            borderRadius="md"
          >
            <Heading size="md" color={staffHeadingColor} mb={2}>
              Available to All Staff
            </Heading>
            <List spacing={2}>
              <ListItem>• View and enter maintenance logs</ListItem>
              <ListItem>• Access dive history and viewing</ListItem>
              <ListItem>• View assets and technician information</ListItem>
            </List>
          </Box>
          <Box
            p={4}
            bg={adminBoxBg}
            border="1px"
            borderColor={adminBoxBorder}
            borderRadius="md"
          >
            <Heading size="md" color={adminHeadingColor} mb={2}>
              Managers & Admins Only
            </Heading>
            <List spacing={2}>
              <ListItem>• Contract creation and management</ListItem>
              <ListItem>• Hotel and dive package configuration</ListItem>
              <ListItem>• Asset and technician editing</ListItem>
              <ListItem>• Administrative functions</ListItem>
            </List>
          </Box>
        </SimpleGrid>
      </VStack>

      {/* Footer */}
      <Box mt={8} textAlign="center">
        <Text fontSize="sm" color="gray.500">
          © 2025 Sea Saba NV - Business Management Platform
        </Text>
        <Text fontSize="xs" color="gray.400" mt={2}>
          This application is continuously evolving. Features may be updated
          based on operational needs.
        </Text>
      </Box>
    </Container>
  );
}
