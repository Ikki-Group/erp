import { IamAuthService } from './auth.service'
import { IamRolesService } from './roles.service'
import { IamUserRoleAssignmentsService } from './user-role-assignments.service'
import { IamUsersService } from './users.service'

export class IamService {
  public readonly auth: IamAuthService

  constructor(
    public readonly users: IamUsersService = new IamUsersService(),
    public readonly roles: IamRolesService = new IamRolesService(),
    public readonly userRoleAssignments: IamUserRoleAssignmentsService = new IamUserRoleAssignmentsService()
  ) {
    this.auth = new IamAuthService(this.users)
  }
}

export { IamAuthService } from './auth.service'
export { IamRolesService } from './roles.service'
export { IamUserRoleAssignmentsService } from './user-role-assignments.service'
export { IamUsersService } from './users.service'
