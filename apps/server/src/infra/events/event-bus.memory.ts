import { getLogger } from '@/infra/logger/index.ts'
import type { DomainEvent, EventBusPort, Handler } from '@/shared/events/event-bus.port.ts'

const logger = getLogger(['events'])

export function createMemoryEventBus(): EventBusPort {
	const handlers = new Map<string, Handler<DomainEvent>[]>()

	return {
		subscribe(type, handler) {
			const list = handlers.get(type) ?? []
			// Handlers are type-safe at subscription; the registry erases their event subtype.
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			list.push(handler as Handler<DomainEvent>)
			handlers.set(type, list)
		},
		publish(event) {
			const list = handlers.get(event.type) ?? []
			for (const handler of list) {
				void Promise.resolve()
					.then(() => handler(event))
					.catch((error: unknown) =>
						logger.warn('event handler failed', {
							type: event.type,
							error: error instanceof Error ? error.message : String(error),
						}),
					)
			}
		},
	}
}
