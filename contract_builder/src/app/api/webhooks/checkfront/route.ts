import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type WebhookPayload = Record<string, unknown>

function tokensMatch(receivedToken: string | null, expectedToken: string | undefined): boolean {
  if (!receivedToken || !expectedToken) {
    return false
  }

  const received = Buffer.from(receivedToken)
  const expected = Buffer.from(expectedToken)

  return received.length === expected.length && timingSafeEqual(received, expected)
}

function getBookingReference(payload: WebhookPayload): string | null {
  const candidates = [
    payload.booking_id,
    payload.bookingId,
    payload.booking_code,
    payload.bookingCode,
    typeof payload.booking === 'object' && payload.booking !== null
      ? (payload.booking as WebhookPayload).booking_id ?? (payload.booking as WebhookPayload).id
      : null,
  ]

  const reference = candidates.find((candidate) => typeof candidate === 'string' || typeof candidate === 'number')

  return reference == null ? null : String(reference)
}

export async function POST(request: NextRequest) {
  const webhookToken = process.env.CHECKFRONT_WEBHOOK_TOKEN

  if (!webhookToken) {
    console.error('[Checkfront Webhook] CHECKFRONT_WEBHOOK_TOKEN is not configured')
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  if (!tokensMatch(request.nextUrl.searchParams.get('token'), webhookToken)) {
    console.warn('[Checkfront Webhook] Rejected request with invalid token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Expected application/json payload' }, { status: 415 })
  }

  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > 1_000_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let payload: WebhookPayload
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected a JSON object payload' }, { status: 400 })
    }
    payload = body as WebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  console.info('[Checkfront Webhook] Received event', {
    bookingReference: getBookingReference(payload),
    payloadKeys: Object.keys(payload).sort(),
  })

  return new NextResponse(null, { status: 200 })
}
