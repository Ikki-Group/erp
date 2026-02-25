import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface DescriptionItem {
  term: ReactNode;
  description: ReactNode;
  className?: string;
  termClassName?: string;
  descriptionClassName?: string;
}

interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: DescriptionItem[];
  variant?: "default" | "bordered" | "striped";
  layout?: "vertical" | "horizontal";
  columns?: 1 | 2 | 3;
}

export function DescriptionList({
  items,
  className,
  variant = "default",
  layout = "horizontal",
  columns = 1,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      className={cn(
        "grid gap-y-4 gap-x-8",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        variant === "bordered" && "divide-y",
        className,
      )}
      {...props}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex",
            layout === "vertical" ? "flex-col gap-1" : "flex-col sm:flex-row sm:gap-4",
            variant === "striped" && index % 2 === 0 && "bg-muted/50 -mx-4 px-4 py-3 rounded-md",
            variant === "bordered" && "py-4 first:pt-0 last:pb-0",
            item.className,
          )}
        >
          <dt
            className={cn(
              "text-sm font-medium text-muted-foreground shrink-0",
              layout === "horizontal" && "w-1/3 min-w-[140px]",
              item.termClassName,
            )}
          >
            {item.term}
          </dt>
          <dd className={cn("text-sm text-foreground flex-1", item.descriptionClassName)}>
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}
