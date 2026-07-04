import { SettingsService, type SettingsDeps } from './settings.service'

export type { SettingsDeps } from './settings.service'

export type SettingsModule = SettingsService

export function createSettingsModule(deps: SettingsDeps): SettingsModule {
	return new SettingsService(deps)
}
