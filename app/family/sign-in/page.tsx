import { redirect } from "next/navigation";
import { signInHref } from "@/lib/config/auth-role";

/** Legacy alias: the portal has no login form of its own. The destination is re-validated by `signInHref` (parent area only). */
export default async function LegacyFamilySignIn({ searchParams }: { searchParams: Promise<{ redirect?: string | string[] }> }) {
  const { redirect: to } = await searchParams;
  redirect(signInHref("parent", typeof to === "string" ? to : null));
}
