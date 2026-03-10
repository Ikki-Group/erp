import type { LocationServiceModule } from '@/modules/location/service'

import { AuthService } from './auth.service'
import { RoleService } from './role.service'
import { SessionService } from './session.service'
import { UserAssignmentService } from './user-assignment.service'
import { UserService } from './user.service'

export class IamServiceModule {
  public readonly role: RoleService
  public readonly session: SessionService
  public readonly userAssignment: UserAssignmentService
  public readonly user: UserService
  public readonly auth: AuthService

  constructor(private readonly location: LocationServiceModule) {
    this.role = new RoleService()
    this.session = new SessionService()
    this.userAssignment = new UserAssignmentService(this.role, this.location.location)
    this.user = new UserService(this.role, this.location, this.userAssignment)
    this.auth = new AuthService(this.user, this.session)
  }
}
