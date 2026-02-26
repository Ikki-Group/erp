import { apiFactory } from "@/lib/api";
import { zHttp } from "@/lib/zod";
import { z } from "zod";

export const authApi = {
  login: apiFactory({
    method: "post",
    url: "iam/auth/login",
    body: z.object({
      identifier: z.string(),
      password: z.string(),
    }),
    result: zHttp.ok(
      z.object({
        token: z.string(),
      }),
    ),
  }),
};
