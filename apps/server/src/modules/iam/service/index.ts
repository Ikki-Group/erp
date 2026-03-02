import type { LocationServiceModule } from '@/modules/location'

import { RoleService } from './role.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly role: RoleService
  public readonly user: UserService
  // public readonly auth: AuthService
  // public readonly session: SessionService

  constructor(private readonly location: LocationServiceModule) {
    this.role = new RoleService()
    this.user = new UserService(this.role, location)
  }
}
