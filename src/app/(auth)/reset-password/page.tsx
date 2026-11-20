import { AuthScreen } from "@/components/shared/auth-preview";
export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string | string[]; error?: string | string[] }> }) {
  const query = await searchParams;
  const token = typeof query.token === "string" && query.token.trim() ? query.token : undefined;
  return <AuthScreen mode="reset" token={token} invalidResetLink={!token || query.error !== undefined}/>;
}
