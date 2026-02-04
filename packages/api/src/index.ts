import { treaty } from "@elysiajs/eden"
import type { App } from "@api/src/app"

const createTreaty = (url: string) => treaty<App>(url)

function example() {
  const app = createTreaty("http://localhost:3000")
}

export type { App }
export { createTreaty }
