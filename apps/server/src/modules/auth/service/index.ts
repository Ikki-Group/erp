import type { IamModule } from '@/modules/iam'

import { AuthService } from './auth.service'
import { SessionService } from './session.service'

export class AuthServiceModule {
	public readonly auth: AuthService
	public readonly session: SessionService

	constructor(iam: IamModule) {
		this.session = new SessionService()
		this.auth = new AuthService(iam.service.user, iam.usecase.user, this.session)
	}
}

export * from './auth.service'
export * from './session.service'
