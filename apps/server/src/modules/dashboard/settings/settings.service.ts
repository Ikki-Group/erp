import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'

import type { SettingsSummaryDto } from './settings.dto'

export class SettingsService {
	constructor(
		private readonly iam: IamServiceModule,
		private readonly location: LocationServiceModule,
	) {}

	async getSettingsSummary(): Promise<SettingsSummaryDto> {
		const [users, roles, locations] = await Promise.all([
			this.iam.user.count(),
			this.iam.role.count(),
			this.location.master.getCount(),
		])

		return { users, roles, locations }
	}
}
