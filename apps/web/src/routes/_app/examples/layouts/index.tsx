import {
  Page,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from "@/components/layout/page-old";
import { Section, SectionHeader, Grid, Stack, Inline } from "@/components/common/layout/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon, SettingsIcon, UserIcon } from "lucide-react";

export const Route = createFileRoute("/_app/examples/layouts/")({
  component: LayoutsPage,
});

function LayoutsPage() {
  return (
    <Page>
      <PageHeader sticky>
        <PageTitleContainer>
          <PageTitle>Layout Primitives</PageTitle>
          <PageDescription>
            Reusable layout components for consistent spacing and alignment.
          </PageDescription>
        </PageTitleContainer>
      </PageHeader>

      <PageContent>
        <Stack gap="xl">
          {/* Grid Examples */}
          <Section>
            <SectionHeader
              title="Grid Layout"
              description="Responsive grid with predefined column configurations"
              action={
                <Button size="sm" variant="outline">
                  <PlusIcon className="h-4 w-4" />
                  Add Item
                </Button>
              }
            />

            <Stack gap="lg">
              {/* 2 Columns (Default) */}
              <div>
                <h3 className="text-sm font-medium mb-3">2 Columns (Default)</h3>
                <Grid>
                  <Card>
                    <CardHeader>
                      <CardTitle>Card 1</CardTitle>
                      <CardDescription>Default grid layout</CardDescription>
                    </CardHeader>
                    <CardContent>Content here</CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Card 2</CardTitle>
                      <CardDescription>Responsive by default</CardDescription>
                    </CardHeader>
                    <CardContent>Content here</CardContent>
                  </Card>
                </Grid>
              </div>

              {/* 3 Columns */}
              <div>
                <h3 className="text-sm font-medium mb-3">3 Columns</h3>
                <Grid cols={3}>
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle>Card {i}</CardTitle>
                      </CardHeader>
                      <CardContent>Three column layout</CardContent>
                    </Card>
                  ))}
                </Grid>
              </div>

              {/* 4 Columns */}
              <div>
                <h3 className="text-sm font-medium mb-3">4 Columns</h3>
                <Grid cols={4} gap="sm">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} size="sm">
                      <CardHeader>
                        <CardTitle>Item {i}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </Grid>
              </div>
            </Stack>
          </Section>

          {/* Stack Examples */}
          <Section>
            <SectionHeader
              title="Stack Layout"
              description="Vertical layout with consistent spacing"
            />

            <Grid>
              <Card>
                <CardHeader>
                  <CardTitle>Default Stack</CardTitle>
                  <CardDescription>Medium gap, stretch alignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stack>
                    <div className="bg-muted p-3 rounded">Item 1</div>
                    <div className="bg-muted p-3 rounded">Item 2</div>
                    <div className="bg-muted p-3 rounded">Item 3</div>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Center Aligned</CardTitle>
                  <CardDescription>Large gap, center alignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stack gap="lg" align="center">
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <h4 className="font-medium">Welcome</h4>
                      <p className="text-sm text-muted-foreground">Get started below</p>
                    </div>
                    <Button>Continue</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Section>

          {/* Inline Examples */}
          <Section>
            <SectionHeader
              title="Inline Layout"
              description="Horizontal layout with flexible alignment"
            />

            <Stack gap="lg">
              <Card>
                <CardHeader>
                  <CardTitle>Space Between</CardTitle>
                  <CardDescription>Common pattern for headers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Inline justify="between">
                    <div>
                      <h4 className="font-medium">Section Title</h4>
                      <p className="text-sm text-muted-foreground">Description text</p>
                    </div>
                    <Button size="sm">
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </Button>
                  </Inline>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Badges & Tags</CardTitle>
                  <CardDescription>Wrapping inline items</CardDescription>
                </CardHeader>
                <CardContent>
                  <Inline wrap gap="sm">
                    <Badge>React</Badge>
                    <Badge>TypeScript</Badge>
                    <Badge>Tailwind CSS</Badge>
                    <Badge>Vite</Badge>
                    <Badge>Tanstack Router</Badge>
                    <Badge>Zustand</Badge>
                    <Badge>Zod</Badge>
                  </Inline>
                </CardContent>
              </Card>
            </Stack>
          </Section>

          {/* Combined Example */}
          <Section>
            <SectionHeader
              title="Combined Layouts"
              description="Composing primitives for complex layouts"
            />

            <Card>
              <CardHeader>
                <Inline justify="between">
                  <div>
                    <CardTitle>Dashboard Overview</CardTitle>
                    <CardDescription>Key metrics and statistics</CardDescription>
                  </div>
                  <Inline gap="sm">
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                    <Button size="sm">Refresh</Button>
                  </Inline>
                </Inline>
              </CardHeader>
              <CardContent>
                <Stack gap="lg">
                  <Grid cols={4} gap="sm">
                    {[
                      { label: "Total Users", value: "1,234" },
                      { label: "Revenue", value: "$45.2K" },
                      { label: "Orders", value: "892" },
                      { label: "Growth", value: "+12.5%" },
                    ].map((stat) => (
                      <Card key={stat.label} size="sm">
                        <CardContent>
                          <Stack gap="sm" align="center">
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      This example combines Grid, Stack, and Inline primitives to create a dashboard
                      layout without any custom className at the screen level.
                    </p>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Section>
        </Stack>
      </PageContent>
    </Page>
  );
}
