import z from "zod"

const str = z.string().trim()
const email = z.string().email()
const num = z.number()
const bool = z.boolean()
const date = z.coerce.date()

export const zh = {
  str,
  email,
  num,
  bool,
  date,
}
