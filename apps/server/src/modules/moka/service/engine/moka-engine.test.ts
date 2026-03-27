import { describe, expect, it, mock } from 'bun:test'

import type { Logger } from 'pino'

import type { MokaAuthEngine } from './moka-auth.service'
import { MokaCategoryEngine } from './moka-category.service'
import { MokaProductEngine } from './moka-product.service'
import { MokaSalesEngine } from './moka-sales.service'

// Mock Logger
const mockLogger = { info: mock(() => {}), error: mock(() => {}), child: mock(() => mockLogger) } as unknown as Logger

// Mock MokaAuthEngine
const mockAuth = {
  getApi: mock(async () => ({
    get: mock(async (url: string) => {
      // Categories
      if (url === '/api/v2/categories') {
        return {
          data: {
            categories: [
              { id: 1, name: 'Category 1' },
              { id: 2, name: 'Category 2' },
            ],
          },
        }
      }
      // Products
      if (url === '/api/v2/items') {
        return {
          data: {
            items: [
              {
                id: 101,
                name: 'Product 1',
                category_name: 'Category 1',
                item_variants: [{ id: 1001, name: 'Variant 1', price: 10000, sku: 'SKU1' }],
              },
            ],
          },
        }
      }
      // Sales List
      if (url === '/order-reporting/backoffice/v1/orders') {
        return { data: { orders: [{ order_token: 'TOKEN1' }, { order_token: 'TOKEN2' }], next_cursor: null } }
      }
      // Sales Detail
      if (url.startsWith('/order-reporting/backoffice/v1/orders/')) {
        const token = url.split('/').pop()
        return {
          data: {
            id: token === 'TOKEN1' ? 1 : 2,
            uuid: `UUID-${token}`,
            payment_no: `PAY-${token}`,
            created_at: '2024-01-01T00:00:00Z',
            total_collected_amount: 50000,
            subtotal: 50000,
            payment_type: 'cash',
            payment_type_label: 'Cash',
            items: [
              {
                id: 201,
                uuid: 'IU1',
                item_id: 101,
                item_name: 'Product 1',
                item_variant_name: 'V1',
                price: 25000,
                quantity: 2,
              },
            ],
          },
        }
      }
      return { data: {} }
    }),
  })),
  ensureAuthenticated: mock(async () => {}),
  buildHeaders: mock(() => ({})),
} as unknown as MokaAuthEngine

describe('Moka Engines', () => {
  describe('MokaCategoryEngine', () => {
    it('should fetch categories and validate with Zod', async () => {
      const engine = new MokaCategoryEngine(mockAuth, mockLogger)
      const results = await engine.fetch()

      expect(results).toHaveLength(2)
      expect(results[0]?.name).toBe('Category 1')
    })
  })

  describe('MokaProductEngine', () => {
    it('should fetch products and validate with Zod', async () => {
      const engine = new MokaProductEngine(mockAuth, mockLogger)
      const results = await engine.fetch()

      expect(results).toHaveLength(1)
      expect(results[0]?.name).toBe('Product 1')
      expect(results[0]?.item_variants).toHaveLength(1)
      expect(results[0]?.item_variants?.[0]?.price).toBe(10000)
    })
  })

  describe('MokaSalesEngine', () => {
    it('should fetch sales tokens then details', async () => {
      const from = new Date('2024-01-01')
      const to = new Date('2024-01-01')
      const engine = new MokaSalesEngine(mockAuth, mockLogger, { from, to })
      const results = await engine.fetch()

      expect(results).toHaveLength(2)
      expect(results[0]?.payment_no).toBe('PAY-TOKEN1')
      expect(results[0]?.items).toHaveLength(1)
      expect(results[0]?.items?.[0]?.price).toBe(25000)
    })
  })
})
