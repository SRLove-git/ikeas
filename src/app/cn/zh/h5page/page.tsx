import { redirect } from "next/navigation";

export default async function H5Page({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  if (!url) redirect("/");
  redirect(url);
}
