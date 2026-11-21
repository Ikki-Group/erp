import { formContext } from '@/lib/form/contexts'
import { FormError } from '@/lib/form/form-error'
import { useUnsavedChangesGuard } from '@/lib/form/use-unsaved-changes-guard'

import { FormPage } from './form-page'
import type { FormPageProps } from './form-page'

/** Full-page editing owns its provider, submission error, and dirty-navigation guard. Fields remain JSX. */
export function EntityEditorPage({ form, children, ...props }: FormPageProps) {
	useUnsavedChangesGuard(form)
	return (
		<formContext.Provider value={form}>
			<FormPage {...props} form={form}>
				{children}
				<FormError />
			</FormPage>
		</formContext.Provider>
	)
}
