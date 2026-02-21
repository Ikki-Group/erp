import { IamAuthService } from './iam-auth.service'
import { IamRolesService } from './iam-roles.service'
import { IamUsersService } from './iam-users.service'

export class IamServiceModule {
  public readonly auth: IamAuthService
  public readonly users: IamUsersService
  public readonly roles: IamRolesService

  constructor() {
    this.users = new IamUsersService()
    this.roles = new IamRolesService()
    this.auth = new IamAuthService(this.users)
  }
}

export { IamAuthService } from './iam-auth.service'
export { IamRolesService } from './iam-roles.service'
export { IamUsersService } from './iam-users.service'
