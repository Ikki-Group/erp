import { AuthService } from './auth.service'
import { RoleService } from './role.service'
import { SessionService } from './session.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly role: RoleService
  public readonly auth: AuthService
  public readonly user: UserService
  public readonly session: SessionService

  constructor() {
    this.role = new RoleService()
    this.user = new UserService()
    this.session = new SessionService()
    this.auth = new AuthService(this.user, this.session)
  }
}

export { AuthService } from './auth.service'
export { RoleService } from './role.service'
export { SessionService } from './session.service'
export { UserService } from './user.service'
