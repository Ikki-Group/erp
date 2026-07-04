import type { SettingsSummaryDto } from './settings.contract'
import type { SettingsDeps } from './settings.module'
import { SettingsError } from './settings.internal'

export class SettingsService {
	constructor(
		private readonly deps: SettingsDeps,
	) {}

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
