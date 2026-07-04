export * from './location.contract'
export type { ILocationRepo } from './location.repo'
export type { LocationModule } from './location.module'

export interface LocationCountPort {
	count(): Promise<number>
}
