import { redirect } from "next/navigation";

export default async function PropertyAlias({
  params,
}: PageProps<"/properties/[id]">) {
  const { id } = await params;
  redirect(`/dashboard/properties/${id}`);
}
