/* eslint-disable */
import { describe, expect, it } from 'bun:test'
import { StockTransactionService } from './stock-transaction.service'

describe('StockTransactionService', () => {
  // @ts-ignore - access private method for testing
  const service = new StockTransactionService(null as any)
  // @ts-ignore
  const calculateIncomingWAC = (service as any).calculateIncomingWAC.bind(service)

  describe('calculateIncomingWAC', () => {
    it('should calculate WAC correctly for initial purchase', () => {
      const result = calculateIncomingWAC(0, 0, 10, 1000)
      expect(result.newQty).toBe(10)
      expect(result.newAvgCost).toBe(1000)
    })

    it('should calculate WAC correctly for subsequent purchase', () => {
      const result = calculateIncomingWAC(10, 1000, 10, 2000)
      expect(result.newQty).toBe(20)
      expect(result.newAvgCost).toBe(1500)
    })

    it('should handle zero quantity correctly', () => {
      const result = calculateIncomingWAC(0, 0, 0, 0)
      expect(result.newQty).toBe(0)
      expect(result.newAvgCost).toBe(0)
    })

    it('should calculate WAC correctly with decimals', () => {
      const result = calculateIncomingWAC(5, 10.5, 5, 12.5)
      expect(result.newQty).toBe(10)
      expect(result.newAvgCost).toBe(11.5)
    })
  })
})
