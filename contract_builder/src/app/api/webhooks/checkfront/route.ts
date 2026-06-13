/**
 * POST /api/webhooks/checkfront
 *
 * Receives webhook notifications from Checkfront when a booking is created
 * or updated, then upserts the corresponding GroupContract in Firestore.
 *
 * Security: Optionally validates the CHECKFRONT_WEBHOOK_SECRET token sent
 * in the X-Checkfront-Token request header.
 *
 * Checkfront webhook payload shape (simplified):
 *   { booking_id: "7999", status: "confirmed", ... }
 *
 * We always respond 200 quickly and do processing synchronously.
 * (Next.js App Router route handlers are serverless — no background workers.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { upsertContractFromCheckfront } from '@/app/(staff)/contracts/_lib/checkfrontInboundAction'

// ============================================================================
// Webhook secret validation
// ============================================================================

function validateWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.CHECKFRONT_WEBHOOK_SECRET
  if (!secret) {
    // No secret configured — allow all requests (not recommended for production)
    console.warn('[CheckfrontWebhook] CHECKFRONT_WEBHOOK_SECRET is not set — skipping auth check')
    return true
  }

  const tokenHeader = request.headers.get('X-Checkfront-Token')
  if (!tokenHeader) {
    console.warn('[CheckfrontWebhook] Missing X-Checkfront-Token header')
    return false
  }

  return tokenHeader === secret
}

// ============================================================================
// Payload parsing
// ============================================================================

interface CheckfrontWebhookPayload {
  booking_id?: string | number
  status?: string
  [key: string]: unknown
}

async function parseBookingId(request: NextRequest): Promise<string | null> {
  let body: CheckfrontWebhookPayload | null = null

  const contentType = request.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData()
      const id = formData.get('booking_id')
      return id ? String(id) : null
    } else {
      // Try JSON first, fall back to text
      const text = await request.text()
      try {
        body = JSON.parse(text)
      } catch {
        // Maybe a query param
        const url = new URL(request.url)
        const id = url.searchParams.get('booking_id')
        return id ?? null
      }
    }
  } catch (err) {
    console.error('[CheckfrontWebhook] Failed to parse request body:', err)
    return null
  }

  if (!body) return null
  const id = body.booking_id
  return id !== undefined && id !== null ? String(id) : null
}

// ============================================================================
// Route handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[CheckfrontWebhook] Received POST from %s', request.headers.get('x-forwarded-for') ?? 'unknown')

  // 1. Validate secret
  if (!validateWebhookSecret(request)) {
    console.warn('[CheckfrontWebhook] Unauthorized — invalid or missing token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse booking ID
  const bookingId = await parseBookingId(request)

  if (!bookingId) {
    console.warn('[CheckfrontWebhook] No booking_id found in payload')
    return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
  }

  console.log('[CheckfrontWebhook] Processing booking_id=%s', bookingId)

  // 3. Upsert the contract
  try {
    const result = await upsertContractFromCheckfront(bookingId)

    console.log(
      '[CheckfrontWebhook] Done: outcome=%s contractId=%s warnings=%d',
      result.outcome,
      result.contractId ?? 'none',
      result.warnings?.length ?? 0
    )

    return NextResponse.json({
      ok: true,
      outcome: result.outcome,
      contractId: result.contractId,
      warnings: result.warnings,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[CheckfrontWebhook] Unhandled error for booking %s: %s', bookingId, msg)
    // Always return 200 to prevent Checkfront from retrying indefinitely on app errors
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}

// ============================================================================
// GET — health-check / Checkfront webhook verification ping
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge')

  if (challenge) {
    // Some webhook systems send a challenge to verify the endpoint
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ ok: true, endpoint: 'checkfront-webhook' })
}
