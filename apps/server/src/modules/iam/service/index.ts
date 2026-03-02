import { RoleService } from './role.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly role: RoleService
  public readonly user: UserService
  // public readonly auth: AuthService
  // public readonly session: SessionService

  constructor() {
    this.role = new RoleService()
    this.user = new UserService()
  }
}
