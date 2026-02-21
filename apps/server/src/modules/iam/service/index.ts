import { IamAuthService } from './iam-auth.service'
import { RoleService } from './role.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly roles: RoleService
  public readonly auth: IamAuthService
  public readonly user: UserService

  constructor() {
    this.roles = new RoleService()
    this.user = new UserService()
    this.auth = new IamAuthService(this.user)
  }
}

export { IamAuthService } from './iam-auth.service'
export { RoleService } from './role.service'
export { UserService } from './user.service'
