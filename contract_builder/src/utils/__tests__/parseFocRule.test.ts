import { describe, it, expect } from 'vitest'
import { parseFocRule } from '@/shared/utils/formatters'

describe('parseFocRule', () => {
  it('handles "7+1"', () => {
    const result = parseFocRule('7+1')
    expect(result).toEqual({ paid: 7, free: 1 })
  })

  it('handles "10+2"', () => {
    const result = parseFocRule('10+2')
    expect(result).toEqual({ paid: 10, free: 2 })
  })

  it('handles invalid input gracefully', () => {
    const result = parseFocRule('')
    expect(result).toEqual({ paid: 0, free: 0 })
  })
})