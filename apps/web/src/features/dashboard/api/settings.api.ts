import { apiFactory } from "@/lib/api";
import { zHttp } from "@/lib/zod";
import { SettingSummaryDto } from "../dto/settings.dto";

export const settingsApi = {
  summary: apiFactory({
    method: "get",
    url: "dashboard/settings/summary",
    result: zHttp.ok(SettingSummaryDto),
  }),
};
