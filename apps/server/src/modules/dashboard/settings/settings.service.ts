import type { IamUserPort, IamRolePort } from '@/modules/iam'
import type { LocationCountPort } from '@/modules/location'

import type { SettingsSummaryDto } from './settings.contract'
import { SettingsError } from './settings.internal'

export interface SettingsDeps {
	iamUser: IamUserPort
	iamRole: IamRolePort
	location: LocationCountPort
}

export class SettingsService {
	constructor(private readonly deps: SettingsDeps) {}

	async getSummary(): Promise<SettingsSummaryDto> {
		const [users, roles, locations] = await Promise.all([
			this.deps.iamUser.count(),
			this.deps.iamRole.count(),
			this.deps.location.count(),
		])

		return { users, roles, locations }
	}

	async handleGetSummary(): Promise<SettingsSummaryDto> {
		const result = await this.getSummary()
		if (!result) throw SettingsError.summaryFailed()
		return result
	}
}
