import { edenTreaty, treaty } from "@elysiajs/eden"
import type { App } from "@api/src"

export const createEdenTreaty = (url: string) => edenTreaty<App>(url)
export const createTreaty = (url: string) => treaty<App>(url)

export const api = createEdenTreaty("http://localhost:3000")

export type Client = ReturnType<typeof createEdenTreaty>
export type Treaty = ReturnType<typeof createTreaty>

export type { App }
