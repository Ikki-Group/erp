import { createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { Grid, Stack } from '@/components/common/layout/primitives'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'


export const Route = createFileRoute('/_app/examples/page-layouts/')({
  component: PageLayoutsExample,
})

function PageLayoutsExample() {
  return (
    <Page size="lg">
      <Page.BlockHeader
        title="Page Layouts"
        description="Reusable layout components for consistent spacing and alignment."
        action={
          <Button size="sm">
            <PlusIcon className="h-4 w-4" />
            Create New
          </Button>
        }
      />

      <Page.Content>
        <Stack gap="xl">
          {/* Page Size Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Page Size Variants</CardTitle>
              <CardDescription>
                Control the maximum width of your page content with size
                variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Available Sizes:</h4>
                  <Grid cols={3} gap="sm">
                    {[
                      {
                        size: 'sm',
                        width: '1024px',
                        use: 'Compact forms, settings',
                      },
                      { size: 'md', width: '1280px', use: 'Balanced layouts' },
                      {
                        size: 'lg',
                        width: '1536px',
                        use: 'Dashboards, tables (default)',
                      },
                      { size: 'xl', width: '1600px', use: 'Wide layouts' },
                      {
                        size: 'full',
                        width: 'No limit',
                        use: 'Full viewport width',
                      },
                    ].map((item) => (
                      <Card key={item.size} size="sm">
                        <CardContent>
                          <Stack gap="sm">
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              size="{item.size}"
                            </code>
                            <div className="text-xs">
                              <div className="font-medium">{item.width}</div>
                              <div className="text-muted-foreground">
                                {item.use}
                              </div>
                            </div>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <code className="text-sm">
                    {'<Page size="lg">...</Page>'}
                  </code>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* Header Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Header Variants</CardTitle>
              <CardDescription>
                Customize header appearance with border and size options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={2}>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Border Variants:</h4>
                  <Stack gap="sm">
                    {[
                      { variant: 'default', desc: 'Bottom border (default)' },
                      { variant: 'shadow', desc: 'Subtle shadow' },
                      { variant: 'none', desc: 'No border' },
                    ].map((item) => (
                      <div
                        key={item.variant}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded"
                      >
                        <code className="text-xs">border="{item.variant}"</code>
                        <span className="text-xs text-muted-foreground">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </Stack>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Size Variants:</h4>
                  <Stack gap="sm">
                    {[
                      { size: 'sm', desc: 'Compact padding' },
                      { size: 'md', desc: 'Default padding' },
                      { size: 'lg', desc: 'Spacious padding' },
                    ].map((item) => (
                      <div
                        key={item.size}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded"
                      >
                        <code className="text-xs">size="{item.size}"</code>
                        <span className="text-xs text-muted-foreground">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </Stack>
                </div>
              </Grid>
            </CardContent>
          </Card>

          {/* Content Padding */}
          <Card>
            <CardHeader>
              <CardTitle>Content Padding Variants</CardTitle>
              <CardDescription>
                Control spacing around page content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={4} gap="sm">
                {[
                  { padding: 'none', desc: 'No padding' },
                  { padding: 'sm', desc: 'Small padding' },
                  { padding: 'md', desc: 'Medium (default)' },
                  { padding: 'lg', desc: 'Large padding' },
                ].map((item) => (
                  <Card key={item.padding} size="sm">
                    <CardContent>
                      <Stack gap="sm" align="center">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          padding="{item.padding}"
                        </code>
                        <span className="text-xs text-muted-foreground text-center">
                          {item.desc}
                        </span>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>New Features</CardTitle>
              <CardDescription>
                Enhanced capabilities for better UX and DX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={2}>
                {[
                  {
                    title: 'Responsive Typography',
                    desc: 'Title sizes scale beautifully across devices',
                    code: '<PageTitle size="lg" />',
                  },
                  {
                    title: 'Sticky Headers',
                    desc: 'Enhanced backdrop blur with smooth transitions',
                    code: '<PageHeader sticky />',
                  },
                  {
                    title: 'Breadcrumb Support',
                    desc: 'Built-in navigation hierarchy component',
                    code: '<PageBreadcrumb>...</PageBreadcrumb>',
                  },
                  {
                    title: 'Flexible Actions',
                    desc: 'Mobile-responsive action button alignment',
                    code: '<PageActions mobileAlign="right" />',
                  },
                  {
                    title: 'Smooth Scrolling',
                    desc: 'Native smooth scroll with custom scrollbar',
                    code: '<PageContent smoothScroll />',
                  },
                  {
                    title: 'Context-Aware',
                    desc: 'Header and content sync with page size',
                    code: 'Automatic via PageContext',
                  },
                ].map((feature) => (
                  <Card key={feature.title} size="sm">
                    <CardContent>
                      <Stack gap="sm">
                        <h4 className="font-medium text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {feature.desc}
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded block">
                          {feature.code}
                        </code>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Example</CardTitle>
              <CardDescription>
                Full implementation with all new features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  <code>{`<Page size="lg">
  <PageHeader sticky border="default" size="md">
    <PageHeaderContent>
      <Stack gap="sm">
        <PageBreadcrumb>
          <HomeIcon /> / Examples / Page
        </PageBreadcrumb>
        
        <PageTitleContainer>
          <PageTitle size="md">Dashboard</PageTitle>
          <PageDescription maxWidth>
            Your overview and analytics
          </PageDescription>
        </PageTitleContainer>
      </Stack>

      <PageActions mobileAlign="right">
        <Button>Create</Button>
      </PageActions>
    </PageHeaderContent>
  </PageHeader>

  <PageContent padding="md" smoothScroll>
    {/* Your content here */}
  </PageContent>
</Page>`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </Stack>
      </Page.Content>
    </Page>
  )
}
