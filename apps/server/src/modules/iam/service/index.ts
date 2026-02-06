import { IamUsersService } from './users.service'

export class IamService {
  constructor(public readonly users: IamUsersService = new IamUsersService()) {}
}
