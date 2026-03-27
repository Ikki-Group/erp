import type { IamServiceModule } from '@/modules/iam/service'

import { AuthService } from './auth.service'
import { SessionService } from './session.service'

export class AuthServiceModule {
  public readonly auth: AuthService
  public readonly session: SessionService

  constructor(iam: IamServiceModule) {
    this.session = new SessionService()
    this.auth = new AuthService(iam.user, this.session)
  }
}

export * from './auth.service'
export * from './session.service'
