'use client'

import { Box, Card, CardBody, Container, Heading, Image, ListItem, OrderedList, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import InstallButton from '@shared/components/InstallButton'

export default function InstallPage() {
  return (
    <Container maxW="4xl" py={{ base: 4, md: 10 }}>
      <VStack spacing={8} textAlign="center">
        <Image src="/SS_blue.svg" alt="Sea Saba" w={{ base: '240px', md: '360px' }} h="auto" />
        <Box>
          <Heading as="h1" size="xl">Sea Saba Business</Heading>
          <Text mt={2} color="textMuted">Scan to install the app</Text>
        </Box>

        <Image
          src="/sea-saba-install-qr.svg"
          alt="QR code for https://seasaba.app"
          boxSize={{ base: '260px', md: '340px' }}
          bg="white"
          borderRadius="md"
          p={3}
        />

        <InstallButton size="lg" />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full" textAlign="left">
          <Card>
            <CardBody>
              <Heading as="h2" size="md" mb={3}>iPhone or iPad</Heading>
              <OrderedList spacing={2} pl={2}>
                <ListItem>Open this page in Safari.</ListItem>
                <ListItem>Tap Share.</ListItem>
                <ListItem>Tap Add to Home Screen.</ListItem>
                <ListItem>Tap Add.</ListItem>
              </OrderedList>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading as="h2" size="md" mb={3}>Android</Heading>
              <OrderedList spacing={2} pl={2}>
                <ListItem>Open this page in Chrome.</ListItem>
                <ListItem>Tap Install Sea Saba above, or open the browser menu.</ListItem>
                <ListItem>Tap Install app.</ListItem>
              </OrderedList>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading as="h2" size="md" mb={3}>Desktop</Heading>
              <OrderedList spacing={2} pl={2}>
                <ListItem>Open this page in Chrome or Edge.</ListItem>
                <ListItem>Click Install Sea Saba above or the install icon in the address bar.</ListItem>
                <ListItem>Confirm Install.</ListItem>
              </OrderedList>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Text fontSize="sm" color="textMuted">
          Sea Saba Business requires an internet connection for business and customer data.
        </Text>
      </VStack>
    </Container>
  )
}
