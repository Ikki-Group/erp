import type { IamUserPort, IamRolePort } from '@/modules/iam'
import type { LocationCountPort } from '@/modules/location'

import { SettingsService } from './settings.service'

export interface SettingsDeps {
	iamUser: IamUserPort
	iamRole: IamRolePort
	location: LocationCountPort
}

export type SettingsModule = SettingsService

export function createSettingsModule(deps: SettingsDeps): SettingsModule {
	return new SettingsService(deps)
}
