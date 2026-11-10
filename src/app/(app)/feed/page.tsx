import { redirect } from "next/navigation";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim();
  redirect(search ? `/?search=${encodeURIComponent(search)}` : "/");
}
