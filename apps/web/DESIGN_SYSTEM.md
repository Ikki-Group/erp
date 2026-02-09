# Design System Components

Komponen-komponen ini dibuat untuk mengurangi boilerplate dan meningkatkan konsistensi UI/UX serta DX (Developer Experience) di aplikasi ERP.

## Page Components (Enhanced)

Komponen dasar untuk struktur halaman dengan responsive behavior yang lebih baik dan variants yang fleksibel.

### Page

Container utama untuk halaman dengan size variants.

```tsx
import { Page } from '@/components/layout/page'

// Default (lg)
<Page>...</Page>

// Compact untuk forms
<Page size="sm">...</Page>

// Wide untuk dashboards
<Page size="xl">...</Page>

// Full width tanpa constraint
<Page size="full">...</Page>
```

**Props:**

- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
  - sm: max-width 1024px (forms, settings)
  - md: max-width 1280px (balanced)
  - lg: max-width 1536px (dashboards, tables)
  - xl: max-width 1600px (wide layouts)
  - full: no constraint

### PageHeader

Header dengan sticky support dan variants.

```tsx
import { PageHeader } from '@/components/layout/page'

// Sticky header dengan border
<PageHeader sticky border="default">...</PageHeader>

// Dengan shadow
<PageHeader sticky border="shadow">...</PageHeader>

// Compact size
<PageHeader size="sm">...</PageHeader>
```

**Props:**

- `sticky`: boolean (default: false)
- `border`: 'default' | 'none' | 'shadow' (default: 'default')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

**Features:**

- Enhanced backdrop blur untuk sticky headers
- Smooth transitions
- Auto-sync dengan Page size untuk consistent max-width

### PageTitle

Heading dengan size variants dan truncate option.

```tsx
import { PageTitle } from '@/components/layout/page'

// Default
<PageTitle>Dashboard</PageTitle>

// Large untuk landing pages
<PageTitle size="lg">Welcome</PageTitle>

// Truncate long titles
<PageTitle truncate>Very Long Title That Will Be Truncated</PageTitle>
```

**Props:**

- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `truncate`: boolean (default: false)

### PageDescription

Subtitle dengan improved readability.

```tsx
import { PageDescription } from '@/components/layout/page'

// Default
<PageDescription>Your dashboard overview</PageDescription>

// Dengan max-width untuk readability
<PageDescription maxWidth>
  Long description text that will be constrained for better reading experience
</PageDescription>
```

**Props:**

- `maxWidth`: boolean (default: false) - Limits width to 2xl for better readability

### PageActions

Container untuk action buttons dengan responsive alignment.

```tsx
import { PageActions } from '@/components/layout/page'

// Default (right aligned on mobile)
<PageActions>
  <Button>Create</Button>
  <Button>Export</Button>
</PageActions>

// Left aligned on mobile
<PageActions mobileAlign="left">...</PageActions>

// Full width on mobile
<PageActions mobileAlign="stretch">...</PageActions>
```

**Props:**

- `mobileAlign`: 'left' | 'right' | 'stretch' (default: 'right')

### PageContent

Scrollable content area dengan padding variants.

```tsx
import { PageContent } from '@/components/layout/page'

// Default
<PageContent>...</PageContent>

// Compact padding
<PageContent padding="sm">...</PageContent>

// Large padding
<PageContent padding="lg">...</PageContent>

// Full width tanpa padding
<PageContent fullWidth>...</PageContent>

// Disable smooth scroll
<PageContent smoothScroll={false}>...</PageContent>
```

**Props:**

- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `fullWidth`: boolean (default: false)
- `fixedHeight`: boolean (default: false)
- `smoothScroll`: boolean (default: true)

**Features:**

- Custom scrollbar styling
- Auto-sync dengan Page size
- Smooth scrolling by default

### PageBreadcrumb

Navigation hierarchy component.

```tsx
import { PageBreadcrumb } from '@/components/layout/page'

;<PageBreadcrumb>
  <HomeIcon className="h-4 w-4" />
  <ChevronRightIcon className="h-3 w-3" />
  <span>Examples</span>
  <ChevronRightIcon className="h-3 w-3" />
  <span className="font-medium">Current Page</span>
</PageBreadcrumb>
```

### PageHeaderContent

Wrapper untuk header content dengan automatic responsive layout.

```tsx
import { PageHeaderContent } from '@/components/layout/page'

;<PageHeader sticky>
  <PageHeaderContent>
    <PageTitleContainer>
      <PageTitle>Dashboard</PageTitle>
      <PageDescription>Overview</PageDescription>
    </PageTitleContainer>

    <PageActions>
      <Button>Action</Button>
    </PageActions>
  </PageHeaderContent>
</PageHeader>
```

### Complete Example

```tsx
import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageTitleContainer,
  PageTitle,
  PageDescription,
  PageActions,
  PageContent,
  PageBreadcrumb,
} from '@/components/layout/page'

function MyPage() {
  return (
    <Page size="lg">
      <PageHeader sticky border="default" size="md">
        <PageHeaderContent>
          <Stack gap="sm">
            <PageBreadcrumb>
              <HomeIcon /> / Dashboard
            </PageBreadcrumb>

            <PageTitleContainer>
              <PageTitle>Analytics Dashboard</PageTitle>
              <PageDescription maxWidth>
                Track your key metrics and performance
              </PageDescription>
            </PageTitleContainer>
          </Stack>

          <PageActions mobileAlign="right">
            <Button variant="outline">Export</Button>
            <Button>Create Report</Button>
          </PageActions>
        </PageHeaderContent>
      </PageHeader>

      <PageContent padding="md" smoothScroll>
        {/* Your content */}
      </PageContent>
    </Page>
  )
}
```

---

## Layout Primitives

### Grid

Responsive grid dengan konfigurasi kolom yang sudah ditentukan.

```tsx
import { Grid } from '@/components/common/layout/primitives'

// 2 kolom (default)
<Grid>
  <Card>...</Card>
  <Card>...</Card>
</Grid>

// 3 kolom dengan gap besar
<Grid cols={3} gap="lg">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</Grid>
```

**Props:**

- `cols`: 1 | 2 | 3 | 4 | 6 (default: 2)
- `gap`: 'sm' | 'md' | 'lg' (default: 'md')

### Stack

Vertical layout dengan spacing konsisten.

```tsx
import { Stack } from '@/components/common/layout/primitives'
;<Stack gap="lg" align="center">
  <Title />
  <Description />
  <Actions />
</Stack>
```

**Props:**

- `gap`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `align`: 'start' | 'center' | 'end' | 'stretch' (default: 'stretch')

### Inline

Horizontal layout dengan spacing konsisten.

```tsx
import { Inline } from '@/components/common/layout/primitives'
;<Inline justify="between" align="center">
  <Title />
  <Actions />
</Inline>
```

**Props:**

- `gap`: 'sm' | 'md' | 'lg' (default: 'md')
- `align`: 'start' | 'center' | 'end' | 'baseline' (default: 'center')
- `justify`: 'start' | 'center' | 'end' | 'between' (default: 'start')
- `wrap`: boolean (default: false)

### Section & SectionHeader

Container untuk section dengan header yang konsisten.

```tsx
import { Section, SectionHeader } from '@/components/common/layout/primitives'
;<Section>
  <SectionHeader
    title="Recent Orders"
    description="Your latest transactions"
    action={<Button>View All</Button>}
  />
  <Grid>{/* content */}</Grid>
</Section>
```

## Chart Components

### ChartCard

Card khusus untuk charts dengan layout yang konsisten.

```tsx
import { ChartCard } from '@/components/common/data-display/chart-card'
;<ChartCard
  title="Revenue Trends"
  description="Monthly performance"
  action={<Select>...</Select>}
  footer={
    <ChartFooterContent
      trend="up"
      trendValue="Trending up by 5.2%"
      trendIcon={<TrendingUpIcon />}
      description="Last 6 months"
    />
  }
>
  <ChartContainer>{/* chart content */}</ChartContainer>
</ChartCard>
```

### ChartGrid

Grid khusus untuk layout charts.

```tsx
import { ChartGrid } from '@/components/common/data-display/chart-card'
;<ChartGrid cols={2}>
  <ChartCard>...</ChartCard>
  <ChartCard>...</ChartCard>
</ChartGrid>
```

### ChartFooterContent

Footer standar untuk charts dengan trend indicator.

```tsx
import { ChartFooterContent } from '@/components/common/data-display/chart-card'
;<ChartFooterContent
  trend="up" // atau "down"
  trendValue="Trending up by 5.2%"
  trendIcon={<TrendingUpIcon className="h-4 w-4" />}
  description="Last 6 months"
/>
```

## Prinsip Penggunaan

### 1. Hindari Custom className di Level Screen

❌ **Buruk:**

```tsx
<div className="grid gap-6 md:grid-cols-2">
  <div className="flex flex-col gap-4">...</div>
</div>
```

✅ **Baik:**

```tsx
<Grid cols={2}>
  <Stack gap="md">...</Stack>
</Grid>
```

### 2. Gunakan Semantic Props

Komponen-komponen ini menggunakan props yang semantic dan mudah dipahami, bukan className mentah.

### 3. Konsistensi Spacing

Semua spacing menggunakan design tokens yang sama:

- `sm`: gap-2 / gap-4
- `md`: gap-4 / gap-6
- `lg`: gap-6 / gap-8
- `xl`: gap-8

### 4. Responsive by Default

Semua komponen sudah responsive tanpa perlu konfigurasi tambahan.

## Contoh Implementasi

Lihat `/examples/charts` untuk contoh lengkap penggunaan komponen-komponen ini.
