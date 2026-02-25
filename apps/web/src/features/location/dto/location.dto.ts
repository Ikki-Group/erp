import { zPrimitive, zSchema } from "@/lib/zod";
import z from "zod";

export const LocationDto = z.object({
  id: zPrimitive.num,
  code: zPrimitive.str,
  name: zPrimitive.str,
  type: zPrimitive.str,
  description: zPrimitive.str,
  isActive: zPrimitive.bool,
  ...zSchema.meta.shape,
});

export type LocationDto = z.infer<typeof LocationDto>;
