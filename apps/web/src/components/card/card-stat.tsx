import { LucideIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export interface CardStatProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  isLoading?: boolean;
}

export function CardStat({ title, value, icon: Icon, description, isLoading }: CardStatProps) {
  return (
    <div className="flex flex-1 items-center gap-2 p-2 rounded-xl border bg-card text-card-foreground min-w-50 transition-all">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="font-bold">{isLoading ? <Skeleton className="w-20 h-4" /> : value}</p>
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
      </div>
    </div>
  );
}
