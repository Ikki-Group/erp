import { NotFoundError } from '@/shared/errors/http-error'

export const ProductionError = {
	workOrderNotFound: (id: number) =>
		new NotFoundError(`Work order with ID ${id} not found`, { code: 'WORK_ORDER_NOT_FOUND' }),
}
