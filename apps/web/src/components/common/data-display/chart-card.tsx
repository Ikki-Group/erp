import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * ChartCard
 * Specialized card for charts with consistent layout and optional filtering
 */
interface ChartCardProps extends React.ComponentProps<typeof Card> {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  action?: React.ReactNode;
}

function ChartCard({
  title,
  description,
  footer,
  action,
  children,
  className,
  ...props
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <CardHeader>
        {action ? (
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {action}
          </div>
        ) : (
          <>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

/**
 * ChartGrid
 * Responsive grid layout for charts
 */
interface ChartGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4;
}

function ChartGrid({ cols = 2, className, ...props }: ChartGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      {...props}
    />
  );
}

/**
 * ChartFooterContent
 * Standardized footer content for charts with trend indicator
 */
interface ChartFooterContentProps {
  trend?: "up" | "down";
  trendValue?: string;
  trendIcon?: React.ReactNode;
  description?: string;
}

function ChartFooterContent({
  trend,
  trendValue,
  trendIcon,
  description,
}: ChartFooterContentProps) {
  return (
    <div className="flex w-full items-start gap-2 text-sm">
      <div className="grid gap-2">
        {trendValue && (
          <div className="flex items-center gap-2 font-medium leading-none">
            {trendValue}
            {trendIcon && (
              <span
                className={cn(
                  "inline-flex",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                )}
              >
                {trendIcon}
              </span>
            )}
          </div>
        )}
        {description && <div className="leading-none text-muted-foreground">{description}</div>}
      </div>
    </div>
  );
}

export { ChartCard, ChartGrid, ChartFooterContent };
