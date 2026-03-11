import type { Logger } from 'pino'
import type { MokaAuthEngine } from './moka-auth.service'

/**
 * Base interface for all Moka scrap engines
 */
export interface IMokaEngine<T> {
  fetch(): Promise<T[]>
}

/**
 * Base class for Moka engines to reduce boilerplate
 */
export abstract class MokaBaseEngine {
  constructor(
    protected readonly auth: MokaAuthEngine,
    protected readonly logger: Logger
  ) {}

  protected async getApi() {
    return this.auth.getApi()
  }

  protected getHeaders(mode: 'AUTHENTICATED' | 'OUTLET' | 'GUEST' = 'AUTHENTICATED') {
    return this.auth.buildHeaders(mode)
  }
}
