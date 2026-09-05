export interface DomainEvent {
	readonly type: string
}

export type Handler<E extends DomainEvent> = (event: E) => Promise<void> | void

export interface EventBusPort {
	/** Publish after commit without blocking the publisher. */
	publish(event: DomainEvent): void
	subscribe<E extends DomainEvent>(type: E['type'], handler: Handler<E>): void
}
