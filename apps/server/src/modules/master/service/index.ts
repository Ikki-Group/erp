import { MasterUomService } from './master-uom.service'

export class MasterService {
  constructor(public readonly uom = new MasterUomService()) {}
}
