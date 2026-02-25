import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section
 * Reusable section container with consistent spacing
 */
interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
}

function Section({ as: Component = "section", className, ...props }: SectionProps) {
  return <Component className={cn("space-y-6", className)} {...props} />;
}

/**
 * SectionHeader
 * Header for a section with title and optional description/actions
 */
interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

function SectionHeader({
  title,
  description,
  action,
  className,
  children,
  ...props
}: SectionHeaderProps) {
  if (!title && !description && !action && !children) return null;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)} {...props}>
      {(title || description || children) && (
        <div className="space-y-1">
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {children}
        </div>
      )}
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * Grid
 * Responsive grid with predefined column configurations
 */
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: "sm" | "md" | "lg";
}

function Grid({ cols = 2, gap = "md", className, ...props }: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        // Gap variants
        gap === "sm" && "gap-4",
        gap === "md" && "gap-6",
        gap === "lg" && "gap-8",
        // Column variants
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        cols === 6 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Stack
 * Vertical stack with consistent spacing
 */
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
}

function Stack({ gap = "md", align = "stretch", className, ...props }: StackProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        // Gap variants
        gap === "sm" && "gap-2",
        gap === "md" && "gap-4",
        gap === "lg" && "gap-6",
        gap === "xl" && "gap-8",
        // Align variants
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Inline
 * Horizontal inline layout with consistent spacing
 */
interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
}

function Inline({
  gap = "md",
  align = "center",
  justify = "start",
  wrap = false,
  className,
  ...props
}: InlineProps) {
  return (
    <div
      className={cn(
        "flex",
        // Gap variants
        gap === "sm" && "gap-2",
        gap === "md" && "gap-4",
        gap === "lg" && "gap-6",
        // Align variants
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "baseline" && "items-baseline",
        // Justify variants
        justify === "start" && "justify-start",
        justify === "center" && "justify-center",
        justify === "end" && "justify-end",
        justify === "between" && "justify-between",
        // Wrap
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  );
}

export { Section, SectionHeader, Grid, Stack, Inline };
