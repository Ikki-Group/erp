import type { Infra } from '@/shared/module.ts'

import type { LocationService } from '@/modules/location/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { AssignmentRepo } from './assignment/assignment.repo.ts'
import { AssignmentService } from './assignment/assignment.service.ts'
import { CategoryRepo } from './category/category.repo.ts'
import { CategoryService } from './category/category.service.ts'
import { MaterialRepo } from './material.repo.ts'
import { createMaterialRoute } from './material.route.ts'
import { MaterialService } from './material.service.ts'

export function createMaterialModule(
	infra: Infra,
	deps: {
		uom: Pick<UomService, 'handleGetById' | 'getAllConversions'>
		location: Pick<LocationService, 'handleGetById'>
	},
) {
	const categoryService = new CategoryService({ ...infra, repo: new CategoryRepo(infra.db) })
	const materialService = new MaterialService({
		...infra,
		repo: new MaterialRepo(infra.db),
		uom: deps.uom,
		category: categoryService,
	})
	const assignmentService = new AssignmentService({
		...infra,
		repo: new AssignmentRepo(infra.db),
		material: materialService,
		location: deps.location,
	})
	const route = createMaterialRoute(materialService, categoryService, assignmentService)
	return { route, materialService, categoryService, assignmentService }
}

export type { MaterialService, CategoryService as MaterialCategoryService }
export type { AssignmentService as MaterialAssignmentService }
export { MaterialDto, MaterialTypeEnum } from '@ikki/contract/material'
export type {
	MaterialCreateDto,
	MaterialUpdateDto,
	MaterialFilterDto,
} from '@ikki/contract/material'
export type { MaterialCategoryDto } from '@ikki/contract/material/category'
export type { MaterialLocationDto, MaterialAssignDto } from '@ikki/contract/material/assignment'
