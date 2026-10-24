// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PERMISSION_GROUPS } from '../dto/index.ts'
import type { RoleDto } from '../dto/index.ts'
import {
	EMPTY_ROLE_FORM_VALUES,
	RoleDetails,
	saveRole,
	toRoleFormValues,
	toRoleInput,
} from './role-form'

const role: RoleDto = {
	id: 12,
	code: 'inventory-lead',
	name: 'Inventory Lead',
	description: 'Manages inventory and production.',
	isSystem: false,
	permissions: ['stock.read', 'receiving.confirm', 'production.confirm', 'audit.read'],
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-02T00:00:00.000Z'),
	createdBy: null,
	updatedBy: null,
}

afterEach(cleanup)

describe('role form mapping', () => {
	it('round-trips custom permissions across groups without leaking entity metadata', () => {
		const values = toRoleFormValues(role)

		expect(values).toEqual({
			code: role.code,
			name: role.name,
			description: role.description,
			permissions: role.permissions,
		})
		expect(toRoleInput(values)).toEqual(values)
	})

	it('preserves every known permission in its original order', () => {
		const permissions = PERMISSION_GROUPS.flatMap((group) => group.permissions).reverse()
		const values = toRoleFormValues({ ...role, permissions })

		expect(toRoleInput(values).permissions).toEqual(permissions)
	})

	it('trims role identity and description without mutating the entered draft', () => {
		const values = {
			...EMPTY_ROLE_FORM_VALUES,
			code: '  custom-role  ',
			name: '  Custom Role  ',
			description: '  Handles inventory  ',
			permissions: ['stock.read'],
		}

		expect(toRoleInput(values)).toEqual({
			code: 'custom-role',
			name: 'Custom Role',
			description: 'Handles inventory',
			permissions: ['stock.read'],
		})
		expect(values.code).toBe('  custom-role  ')
		expect(values.name).toBe('  Custom Role  ')
		expect(values.description).toBe('  Handles inventory  ')
		expect(values.permissions).toEqual(['stock.read'])
	})

	it('allows a custom role with no permissions', () => {
		const values = { ...toRoleFormValues(role), permissions: [] }
		expect(toRoleInput(values).permissions).toEqual([])
	})

	it('rejects unknown permissions rather than silently dropping them', () => {
		const values = { ...toRoleFormValues(role), permissions: ['stock.read', 'unknown.read'] }

		expect(() => toRoleInput(values)).toThrow('Unknown permission')
		expect(values.permissions).toEqual(['stock.read', 'unknown.read'])
	})
})

describe('system role immutability', () => {
	it('rejects a direct save of a system role before reaching the resource', async () => {
		const systemRole = { ...role, isSystem: true }
		const input = toRoleInput({ ...toRoleFormValues(systemRole), name: 'Changed name' })

		await expect(saveRole(input, systemRole)).rejects.toThrow('System roles cannot be modified.')
		expect(systemRole.name).toBe('Inventory Lead')
		expect(systemRole.permissions).toEqual(role.permissions)
	})

	it('keeps permission search usable without a form or editable controls', () => {
		const systemRole = { ...role, isSystem: true }
		const { container } = render(<RoleDetails role={systemRole} />)

		expect(container.querySelector('form')).toBeNull()
		expect(
			screen.queryByRole('button', { name: /save|edit|delete|select all|^clear$/iu }),
		).toBeNull()
		for (const checkbox of screen.getAllByRole('checkbox')) {
			expect(
				checkbox.hasAttribute('disabled') || checkbox.getAttribute('aria-disabled') === 'true',
			).toBe(true)
		}

		fireEvent.change(screen.getByRole('textbox', { name: 'Search permissions' }), {
			target: { value: 'receiving.confirm' },
		})
		expect(screen.getByText('Inventory')).toBeTruthy()
		expect(screen.getByText('Confirm')).toBeTruthy()
		expect(screen.queryByText('Company')).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Clear permission search' }))
		expect(screen.getByText('Company')).toBeTruthy()
		expect(systemRole.permissions).toEqual(role.permissions)
	})
})
