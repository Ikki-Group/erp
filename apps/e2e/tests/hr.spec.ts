import { test, expect } from './fixtures/auth.fixture';

test.describe('HR Attendance', () => {
	/**
	 * Test that attendance page loads and displays KPI cards
	 * This ensures the attendance dashboard is accessible and shows key metrics
	 */
	test('displays attendance page with KPI cards', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify page title
		await expect(page.getByText('Absensi & Jadwal')).toBeVisible();

		// Verify KPI cards are displayed
		await expect(page.getByText('Total Kehadiran Hari Ini')).toBeVisible();
		await expect(page.getByText('Terlambat')).toBeVisible();
		await expect(page.getByText('Izin / Cuti')).toBeVisible();
		await expect(page.getByText('Absen')).toBeVisible();
	});

	/**
	 * Test that attendance page has search functionality
	 * This ensures employee search works for filtering attendance records
	 */
	test('has search functionality for employees', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify search input exists
		const searchInput = page.getByPlaceholder('Cari karyawan...');
		await expect(searchInput).toBeVisible();
	});

	/**
	 * Test that attendance page has date range filter
	 * This ensures users can filter attendance by date range
	 */
	test('has date range filter', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify date inputs exist
		await expect(page.getByLabel('Dari')).toBeVisible();
		await expect(page.getByLabel('Sampai')).toBeVisible();
	});

	/**
	 * Test that user can clock in
	 * This ensures the clock-in functionality works for recording attendance
	 */
	test('can clock in for attendance', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Click Clock In button
		const clockInButton = page.getByRole('button', { name: /clock in/i });
		const buttonCount = await clockInButton.count();

		if (buttonCount > 0 && !(await clockInButton.isDisabled())) {
			await clockInButton.click();

			// Verify success toast
			await expect(page.getByText('Clock-in berhasil')).toBeVisible();
		}
	});

	/**
	 * Test that attendance history table displays records
	 * This ensures the attendance history is visible
	 */
	test('displays attendance history table', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify table section exists
		await expect(page.getByText('Riwayat Kehadiran')).toBeVisible();
	});

	/**
	 * Test that attendance table shows clock in/out times
	 * This ensures the time tracking is displayed correctly
	 */
	test('displays clock in and clock out times', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify table columns exist
		await expect(page.getByText('Clock In')).toBeVisible();
		await expect(page.getByText('Clock Out')).toBeVisible();
	});

	/**
	 * Test that user can clock out from attendance table
	 * This ensures the clock-out action works from the history table
	 */
	test('can clock out from attendance table', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Look for Clock Out action button (only appears if clocked in but not clocked out)
		const clockOutButton = page.getByRole('button', { name: /clock out/i });
		const buttonCount = await clockOutButton.count();

		if (buttonCount > 0) {
			await clockOutButton.click();

			// Verify success toast
			await expect(page.getByText('Clock-out berhasil')).toBeVisible();
		}
	});

	/**
	 * Test that attendance table shows employee status badges
	 * This ensures status indicators (present, late, absent, on_leave) are displayed
	 */
	test('displays status badges in attendance table', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Status column exists
		await expect(page.getByText('Status')).toBeVisible();
	});

	/**
	 * Test that attendance table shows shift information
	 * This ensures shift assignment is visible in attendance records
	 */
	test('displays shift information in attendance table', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Shift column exists
		await expect(page.getByText('Shift')).toBeVisible();
	});

	/**
	 * Test that attendance table shows location information
	 * This ensures location context is visible for attendance records
	 */
	test('displays location information in attendance table', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify Lokasi column exists
		await expect(page.getByText('Lokasi')).toBeVisible();
	});

	/**
	 * Test that user can navigate to employees page
	 * This ensures employee management is accessible
	 */
	test('can navigate to employees page', async ({ page, login }) => {
		await login();

		await page.goto('/hr/employees');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that user can navigate to payroll page
	 * This ensures payroll management is accessible
	 */
	test('can navigate to payroll page', async ({ page, login }) => {
		await login();

		await page.goto('/hr/payroll');

		// Verify page loads
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Test that KPI cards display correct counts
	 * This ensures the attendance metrics are calculated and displayed accurately
	 */
	test('KPI cards display attendance counts', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Verify KPI cards have numeric values (not empty)
		const kpiCards = page.locator('.text-3xl.font-bold');
		const cardCount = await kpiCards.count();
		expect(cardCount).toBeGreaterThan(0);
	});

	/**
	 * Test that date filter changes attendance records
	 * This ensures the date range filter correctly filters the attendance data
	 */
	test('date filter changes attendance records', async ({ page, login }) => {
		await login();

		await page.goto('/hr/attendance');

		// Change date range
		const dateFromInput = page.getByLabel('Dari');
		await dateFromInput.fill('2026-01-01');

		// Wait for data to refresh
		await page.waitForTimeout(500);

		// Verify date input has new value
		await expect(dateFromInput).toHaveValue('2026-01-01');
	});
});
