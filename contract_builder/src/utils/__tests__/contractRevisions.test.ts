import { describe, expect, it } from 'vitest'
import {
  cloneNoteForRevision,
  clonePaymentForRevision
} from '@/app/(staff)/contracts/_lib/contractRevisions'

describe('contractRevisions helpers', () => {
  it('clones payment data to a new contract while preserving original fields', () => {
    const originalPayment = {
      contractId: 'old-contract-id',
      amount: 500,
      paymentType: 'deposit',
      status: 'confirmed'
    }

    const clonedPayment = clonePaymentForRevision(
      originalPayment,
      'new-contract-id',
      'old-contract-id'
    )

    expect(clonedPayment).toMatchObject({
      amount: 500,
      paymentType: 'deposit',
      status: 'confirmed',
      contractId: 'new-contract-id',
      revisedFromContractId: 'old-contract-id'
    })
    expect(clonedPayment).toHaveProperty('revisedAt')
    expect(originalPayment.contractId).toBe('old-contract-id')
  })

  it('clones note data and adds revision metadata', () => {
    const originalNote = {
      text: 'Client requested updated cancellation clause',
      createdBy: 'user-1',
      createdByName: 'Agent Smith'
    }

    const clonedNote = cloneNoteForRevision(originalNote)

    expect(clonedNote).toMatchObject({
      text: 'Client requested updated cancellation clause',
      createdBy: 'user-1',
      createdByName: 'Agent Smith'
    })
    expect(clonedNote).toHaveProperty('revisedAt')
  })
})
