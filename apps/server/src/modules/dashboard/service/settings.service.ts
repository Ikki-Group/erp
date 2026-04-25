import type { IamModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'

import type { SettingsSummaryDto } from '../dto'

export class SettingsService {
	constructor(
		private readonly iam: IamModule,
		private readonly location: LocationServiceModule,
	) {}

	async getSettingsSummary(): Promise<SettingsSummaryDto> {
		const [users, roles, locations] = await Promise.all([
			this.iam.service.user.count(),
			this.iam.service.role.count(),
			this.location.location.count(),
		])

		return { users, roles, locations }
	}
}
