import type { LocationServiceModule } from '@/modules/location/service'

import { RoleService, UserAssignmentService, UserService } from './service'

export interface IamServices {
	user: UserService
	role: RoleService
	assignment: UserAssignmentService
}

/**
 * IamModule — public API for external module consumption.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ IMPORT GUIDE — iam module                                       │
 * │                                                                 │
 * │ External modules SHOULD import:                                 │
 * │   IamModule, IamServices  →  '@/modules/iam'                   │
 * │   DTOs                    →  '@/modules/iam/dto/user.dto'       │
 * │   DTOs (multi)            →  '@/modules/iam/dto'               │
 * │   Specific service type   →  '@/modules/iam/service/user.service'│
 * │                                                                 │
 * │ External modules MUST NOT:                                      │
 * │   import * from '@/modules/iam'  (causes heavy autocomplete)   │
 * │   import repo classes directly                                  │
 * └─────────────────────────────────────────────────────────────────┘
 */
export class IamModule {
	public readonly service: IamServices

	constructor(private getExternalModules: () => { location: LocationServiceModule }) {
		const role = new RoleService()
		const assignment = new UserAssignmentService()
		const user = new UserService(
			undefined,
			() => role,
			() => assignment,
			() => this.getExternalModules().location.location,
		)

		this.service = { user, role, assignment }
	}
}
