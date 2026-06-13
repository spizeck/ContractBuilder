'use client'

import React, { useState } from 'react'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Heading,
  HStack,
  Input,
  Text,
  UnorderedList,
  ListItem,
  VStack,
} from '@chakra-ui/react'
import ProtectedRoute from '@shared/components/LayoutComponents/ProtectedRoute'
import { triggerInboundSyncAction } from '@/app/(staff)/contracts/_lib/checkfrontInboundAction'
import type { InboundSyncResult } from '@/app/(staff)/contracts/_lib/checkfrontInboundAction'

export default function CheckfrontInboundPage() {
  return (
    <ProtectedRoute adminOnly>
      <CheckfrontInboundContent />
    </ProtectedRoute>
  )
}

function CheckfrontInboundContent() {
  const [bookingId, setBookingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InboundSyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    if (!bookingId.trim()) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await triggerInboundSyncAction(bookingId.trim())
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const outcomeColor = (outcome: InboundSyncResult['outcome']) => {
    switch (outcome) {
      case 'created': return 'green'
      case 'updated': return 'blue'
      case 'skipped': return 'yellow'
      case 'error': return 'red'
    }
  }

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="lg" mb={2}>
            Checkfront Inbound Sync
          </Heading>
          <Text color="textMuted" fontSize="sm">
            Manually pull a Checkfront booking into the app and create or update the corresponding
            GroupContract. Only bookings with items in the Group Travel category are processed.
          </Text>
        </Box>

        <Divider />

        <Box>
          <Heading as="h2" size="sm" mb={3}>
            Webhook Endpoint
          </Heading>
          <Text fontSize="sm" mb={2}>
            Configure Checkfront to POST to the following URL when a booking is created or updated:
          </Text>
          <Code p={2} borderRadius="md" display="block" fontSize="sm">
            POST /api/webhooks/checkfront
          </Code>
          <Text fontSize="xs" color="textMuted" mt={2}>
            Set the <Code fontSize="xs">X-Checkfront-Token</Code> header to the value of the{' '}
            <Code fontSize="xs">CHECKFRONT_WEBHOOK_SECRET</Code> environment variable.
          </Text>
        </Box>

        <Divider />

        <Box>
          <Heading as="h2" size="sm" mb={3}>
            Manual Trigger (Dev / Testing)
          </Heading>
          <Text fontSize="sm" mb={3}>
            Enter a Checkfront booking ID to manually trigger an inbound sync. This is equivalent
            to what happens when the webhook fires.
          </Text>

          <HStack>
            <Input
              placeholder="Checkfront booking ID (e.g. 7999)"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSync() }}
              maxW="300px"
            />
            <Button
              colorScheme="purple"
              onClick={handleSync}
              isLoading={loading}
              loadingText="Syncing…"
              isDisabled={!bookingId.trim()}
            >
              Sync Booking
            </Button>
          </HStack>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {result && (
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <HStack mb={3}>
              <Text fontWeight="bold">Result:</Text>
              <Badge colorScheme={outcomeColor(result.outcome)} textTransform="uppercase">
                {result.outcome}
              </Badge>
            </HStack>

            <VStack align="stretch" spacing={1} fontSize="sm">
              <HStack>
                <Text color="textMuted" minW="120px">Booking ID:</Text>
                <Text>{result.bookingId}</Text>
              </HStack>

              {result.contractId && (
                <HStack>
                  <Text color="textMuted" minW="120px">Contract ID:</Text>
                  <Code fontSize="xs">{result.contractId}</Code>
                </HStack>
              )}

              {result.error && (
                <Alert status="error" mt={2}>
                  <AlertIcon />
                  {result.error}
                </Alert>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <Box mt={2}>
                  <Text fontWeight="medium" mb={1}>Warnings ({result.warnings.length}):</Text>
                  <UnorderedList spacing={1} pl={4}>
                    {result.warnings.map((w, i) => (
                      <ListItem key={i} fontSize="xs" color="orange.600">{w}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}

              {result.outcome === 'created' && result.contractId && (
                <Alert status="success" mt={2}>
                  <AlertIcon />
                  New contract created. You can view it in the contracts list.
                </Alert>
              )}

              {result.outcome === 'updated' && result.contractId && (
                <Alert status="info" mt={2}>
                  <AlertIcon />
                  Existing contract updated from Checkfront data.
                </Alert>
              )}

              {result.outcome === 'skipped' && (
                <Alert status="warning" mt={2}>
                  <AlertIcon />
                  Booking was skipped — no Group Travel items found (category ID not matched).
                </Alert>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
