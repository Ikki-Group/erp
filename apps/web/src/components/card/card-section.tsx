import { ComponentProps } from "react";
import { Card } from "@/components/ui/card";

interface CardSectionProps extends Omit<ComponentProps<"div">, "title"> {
  title: string;
}

export function CardSection({ title, children, ...props }: CardSectionProps) {
  return (
    <Card size="sm" {...props}>
      <Card.Header className="border-b">
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-4">{children}</Card.Content>
    </Card>
  );
}
