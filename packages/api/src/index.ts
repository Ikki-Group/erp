import { treaty, Treaty } from "@elysiajs/eden"
import type { App } from "@api/src/app"

const createTreaty = (url: string) => treaty<App>(url, {})

function example() {
  const app = createTreaty("http://localhost:3000")

  app.iam.roles.detail.get({ query: { id: 1 } })

  type A = Treaty.Data<typeof app.iam.roles.detail.get>
  type Param = Parameters<typeof app.iam.roles.create.post>
}

export type { App }
export { createTreaty }
