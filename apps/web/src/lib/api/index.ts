export { httpClient, setTokenAccessor } from './client.ts'
export type { ApiClient } from './client.ts'

export { ApiError, isApiError } from './errors.ts'
export type { ApiErrorOptions, ApiErrorPayload } from './errors.ts'

export { isSchemaValidationError, SchemaValidationError } from './schema-error.ts'
export type { ValidationTarget } from './schema-error.ts'

export { buildSearchParams, requestJson } from './http.ts'
export type { RequestConfig } from './http.ts'

export { parseOrThrow } from './validate.ts'

export { createQueryKeys } from './query-keys.ts'
export type { QueryKeys } from './query-keys.ts'

export type { Args, EndpointKind, HttpMethod, Input, MaybeSchema, Output, QueryKey } from './types.ts'

export { defineEndpoint, defineMutation, defineQuery } from './endpoint.ts'
export type {
	InvalidateTarget,
	MutationEndpoint,
	MutationEndpointConfig,
	QueryEndpoint,
	QueryEndpointConfig,
} from './endpoint.ts'

export { defineResource } from './resource.ts'
export type { DefineResourceConfig, ResourceUrls } from './resource.ts'
