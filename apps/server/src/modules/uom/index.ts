import type { Infra } from '@/shared/module.ts'

import { UomRepo } from './uom.repo.ts'
import { createUomRoute } from './uom.route.ts'
import { UomService } from './uom.service.ts'

export function createUomModule(infra: Infra) {
	const uomService = new UomService({ ...infra, repo: new UomRepo(infra.db) })
	return { route: createUomRoute(uomService), uomService }
}

export type { UomService }
export { resolveConversion } from './uom.calculator.ts'
export { UomDto, UomCategoryEnum, UomConversionDto } from './uom.contract.ts'
export type { UomCreateDto, UomUpdateDto, UomConversionCreateDto } from './uom.contract.ts'
