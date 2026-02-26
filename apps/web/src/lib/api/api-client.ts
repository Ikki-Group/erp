import ky from "ky";

import { API_URL } from "@/config/constant";
import { useAuth } from "../auth";

const apiClient = ky.create({
  prefixUrl: API_URL,
  headers: {
    "X-Platform": "web",
    "X-Creator-Mail": "rizqynugroho88@gmail.com",
  },
  hooks: {
    beforeRequest: [
      (req) => {
        const token = useAuth.getState().token;
        if (token) {
          req.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
  retry: {
    methods: ["get"],
  },
});

export { apiClient };
