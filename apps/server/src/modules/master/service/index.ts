import { UomService } from './uom.service'

export class MasterServiceModule {
  constructor(public readonly uom = new UomService()) {}
}
