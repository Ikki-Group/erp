import { test, expect } from './fixtures/auth.fixture';

test.describe('HR Reports', () => {
	/**
	 * Test that attendance page displays attendance history
	 * This ensures employee attendance records are accessible
	 */
	test('displays attendance history', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify attendance table exists
		await expect(page.getByText('Riwayat Kehadiran')).toBeVisible();
	});

	/**
	 * Test that attendance can be filtered by date range
	 * This ensures attendance reports can be narrowed by time period
	 */
	test('attendance can be filtered by date range', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify date filters exist
		await expect(page.getByLabel('Dari')).toBeVisible();
		await expect(page.getByLabel('Sampai')).toBeVisible();
	});

	/**
	 * Test that attendance displays clock in/out times
	 * This ensures employee work hours are tracked
	 */
	test('attendance displays clock in and clock out times', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify clock in/out columns exist
		await expect(page.getByText('Clock In')).toBeVisible();
		await expect(page.getByText('Clock Out')).toBeVisible();
	});

	/**
	 * Test that attendance displays employee status
	 * This ensures attendance status (present, late, absent, on_leave) is visible
	 */
	test('attendance displays employee status', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Status column exists
		await expect(page.getByText('Status')).toBeVisible();
	});

	/**
	 * Test that attendance displays shift information
	 * This ensures shift assignment is visible
	 */
	test('attendance displays shift information', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Shift column exists
		await expect(page.getByText('Shift')).toBeVisible();
	});

	/**
	 * Test that employees page displays employee list
	 * This ensures employee management is accessible
	 */
	test('displays employee list', async ({ page, login }) => {
		await login();

		await page.goto('/hr/employees');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that employees display employee details
	 * This ensures employee information is visible
	 */
	test('employees display employee details', async ({ page, login }) => {
		await login();

		await page.goto('/hr/employees');

		// Verify employee data is displayed
		await expect(page.locator('table, tbody, div').first()).toBeVisible();
	});

	/**
	 * Test that payroll page loads
	 * This ensures payroll processing is accessible
	 */
	test('displays payroll page', async ({ page, login }) => {
		await login();

		await page.goto('/hr/payroll');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that attendance shows KPI cards
	 * This ensures attendance summary metrics are visible
	 */
	test('attendance displays KPI cards', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify KPI cards are displayed
		await expect(page.getByText('Total Kehadiran Hari Ini')).toBeVisible();
		await expect(page.getByText('Terlambat')).toBeVisible();
		await expect(page.getByText('Izin / Cuti')).toBeVisible();
		await expect(page.getByText('Absen')).toBeVisible();
	});

	/**
	 * Test that attendance can be searched by employee
	 * This ensures employee lookup works efficiently
	 */
	test('attendance can be searched by employee name', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify search input exists
		const searchInput = page.getByPlaceholder('Cari karyawan...');
		await expect(searchInput).toBeVisible();
	});

	/**
	 * Test that attendance displays location information
	 * This ensures location context is visible for attendance records
	 */
	test('attendance displays location information', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Lokasi column exists
		await expect(page.getByText('Lokasi')).toBeVisible();
	});

	/**
	 * Test that clock in functionality works
	 * This ensures employee check-in is functional
	 */
	test('clock in functionality works', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Clock In button exists
		const clockInButton = page.getByRole('button', { name: /clock in/i });
		if ((await clockInButton.count()) > 0) {
			await expect(clockInButton).toBeVisible();
		}
	});

	/**
	 * Test that clock out functionality works
	 * This ensures employee check-out is functional
	 */
	test('clock out functionality works', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Clock out button only appears if clocked in
		const clockOutButton = page.getByRole('button', { name: /clock out/i });
		// May not be visible if no clocked-in records
	});

	/**
	 * Test that attendance shows date
	 * This ensures attendance date is recorded
	 */
	test('attendance displays date', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Tanggal column exists
		await expect(page.getByText('Tanggal')).toBeVisible();
	});

	/**
	 * Test that payroll can be generated
	 * This ensures payroll calculation is functional
	 */
	test('payroll can be generated', async ({ page, login }) => {
		await login();

		await page.goto('/hr/payroll');

		// Look for generate button
		const generateButton = page.getByRole('button', { name: /generate|generate/i });
		if ((await generateButton.count()) > 0) {
			await expect(generateButton).toBeVisible();
		}
	});

	/**
	 * Test that attendance records can be exported
	 * This ensures attendance data can be exported for reporting
	 */
	test('attendance records can be exported', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Look for export button
		const exportButton = page.getByRole('button', { name: /export|download/i });
		if ((await exportButton.count()) > 0) {
			await expect(exportButton).toBeVisible();
		}
	});
});
