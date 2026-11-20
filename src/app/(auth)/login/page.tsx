import { AuthScreen } from "@/components/shared/auth-preview";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verification?: string; error?: string }> }) {
  const query = await searchParams;
  const returned = query.verification === "complete";
  return <AuthScreen mode="login" verificationResult={returned ? query.error ? "invalid" : "returned" : undefined}/>;
}
