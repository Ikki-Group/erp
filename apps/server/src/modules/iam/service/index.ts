import { RoleService } from './role.service'
import { UserAssignmentService } from './user-assignment.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly role: RoleService
  public readonly userAssignment: UserAssignmentService
  public readonly user: UserService

  constructor() {
    this.role = new RoleService()
    this.userAssignment = new UserAssignmentService()
    this.user = new UserService(this.userAssignment)
  }
}

export * from './role.service'
export * from './user-assignment.service'
export * from './user.service'
