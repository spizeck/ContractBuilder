import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type WebhookPayload = Record<string, unknown>

function asRecord(value: unknown): WebhookPayload | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as WebhookPayload)
    : null
}

function getBookingReference(payload: WebhookPayload): string | null {
  const booking = asRecord(payload.booking)
  const attributes = booking ? asRecord(booking['@attributes']) : null
  const candidates = [
    payload.booking_id,
    payload.bookingId,
    payload.booking_code,
    payload.bookingCode,
    booking?.booking_id,
    booking?.id,
    attributes?.booking_id,
  ]

  const reference = candidates.find((candidate) => typeof candidate === 'string' || typeof candidate === 'number')

  return reference == null ? null : String(reference)
}

function getCategoryIds(payload: WebhookPayload): string[] {
  const booking = asRecord(payload.booking)
  const order = booking ? asRecord(booking.order) : null
  const items = order ? asRecord(order.items) : null
  const itemValue = items?.item
  const itemRecords = Array.isArray(itemValue) ? itemValue.map(asRecord) : [asRecord(itemValue)]

  return itemRecords
    .flatMap((item) => item?.category_id == null ? [] : [String(item.category_id)])
    .filter((categoryId, index, categoryIds) => categoryIds.indexOf(categoryId) === index)
    .sort()
}

export async function POST(request: NextRequest) {
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
    categoryIds: getCategoryIds(payload),
    payloadKeys: Object.keys(payload).sort(),
  })

  return new NextResponse(null, { status: 200 })
}
