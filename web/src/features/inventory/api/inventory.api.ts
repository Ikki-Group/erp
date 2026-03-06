import z from 'zod'
import { StockLedgerFilterDto, StockLedgerSelectDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'

export const inventoryApi = {
  ledger: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.ledger,
    params: z.object({
      ...zHttp.pagination.shape,
      ...StockLedgerFilterDto.shape,
    }),
    result: zHttp.paginated(StockLedgerSelectDto.array()),
  }),
}
