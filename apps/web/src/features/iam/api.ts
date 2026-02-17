import { apiFactory, appApi, edenWrapper } from '@/lib/api'

export const iamApi = {
  auth: {
    login: apiFactory({
      keys: ['auth'],
      fn: (params: { identifier: string; password: string }) =>
        edenWrapper(
          appApi.iam.auth.login.post({
            identifier: params.identifier,
            password: params.password,
          }),
        ),
    }),
  },
}
