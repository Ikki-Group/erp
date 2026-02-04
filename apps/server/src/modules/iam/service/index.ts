import type { IamUsersService } from './iam-users.service'

export class IamService {
  constructor(public readonly userSvc: IamUsersService) {}
}
