import z from "zod";

const str = z.string().trim();
const strNullable = z
  .string()
  .trim()
  .nullable()
  .transform((val) => val?.trim() || null);

const num = z.number();
const numCoerce = z.coerce.number();

const date = z.coerce.date();
const bool = z.boolean();
const email = z.email();
const uuid = z.uuidv7();

const idNum = z.number().int().positive();
const idNumCoerce = z.coerce.number().int().positive();

export const zPrimitive = {
  str,
  strNullable,
  num,
  numCoerce,
  date,
  bool,
  email,
  uuid,
  idNum,
  idNumCoerce,
};
