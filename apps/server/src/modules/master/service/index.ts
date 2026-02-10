import { MasterUomService } from './master-uom.service'

export class MasterServiceModule {
  constructor(public readonly uom = new MasterUomService()) {}
}
