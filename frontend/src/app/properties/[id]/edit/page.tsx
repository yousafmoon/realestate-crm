import { redirect } from "next/navigation";

export default async function EditPropertyAlias({
  params,
}: PageProps<"/properties/[id]/edit">) {
  const { id } = await params;
  redirect(`/dashboard/properties/${id}/edit`);
}
