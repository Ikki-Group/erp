import { treaty } from "@elysiajs/eden"
import type { App } from "../../../apps/server/src/app"

export const createTreaty = (url: string) => treaty<App>(url)

export type { App }
