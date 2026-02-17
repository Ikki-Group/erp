import { treaty, type Treaty } from "@elysiajs/eden"
import type { App } from "@api/src/app"

export const createTreaty = (url: string): Treaty<App> => treaty<App>(url)

export type { App }
