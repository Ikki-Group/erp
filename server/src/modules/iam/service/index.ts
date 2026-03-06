import type { LocationServiceModule } from '@/modules/location'

import { AuthService } from './auth.service'
import { RoleService } from './role.service'
import { SessionService } from './session.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly role: RoleService
  public readonly session: SessionService
  public readonly user: UserService
  public readonly auth: AuthService

  constructor(private readonly location: LocationServiceModule) {
    this.role = new RoleService()
    this.session = new SessionService()
    this.user = new UserService(this.role, this.location)
    this.auth = new AuthService(this.user, this.session)
  }
}
