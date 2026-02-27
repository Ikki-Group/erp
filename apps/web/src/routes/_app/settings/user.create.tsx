import { createFileRoute } from "@tanstack/react-router";
import { UserFormPage } from "@/features/iam/components/user-form-page";

export const Route = createFileRoute("/_app/settings/user/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <UserFormPage mode="create" backTo={{ to: "/settings/user" }} />;
}
