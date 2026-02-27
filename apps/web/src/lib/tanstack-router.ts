import {
  createRouter as createTanStackRouter,
  parseSearchWith,
  stringifySearchWith,
} from "@tanstack/react-router";
import * as JSURL2 from "jsurl2";

import { queryClient } from "./query-client";
import type { QueryClient } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";

export interface RouteContext {
  qc: QueryClient;
}

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    trailingSlash: "never",
    notFoundMode: "fuzzy",
    defaultStaleTime: 0,
    defaultGcTime: 0,
    context: {
      qc: queryClient,
    },
    parseSearch: parseSearchWith(JSURL2.parse),
    stringifySearch: stringifySearchWith(JSURL2.stringify, JSURL2.parse),
    // defaultPendingComponent: LoadingScreen,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
