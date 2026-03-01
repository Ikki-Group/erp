import { UserService } from './user.service'

export class IamServiceModule {
  // public readonly role: RoleService
  // public readonly auth: AuthService
  public readonly user: UserService
  // public readonly session: SessionService

  constructor() {
    this.user = new UserService()
  }
}
