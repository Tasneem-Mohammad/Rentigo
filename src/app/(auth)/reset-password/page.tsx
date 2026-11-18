import { AuthScreen } from "@/components/shared/auth-preview";
export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <AuthScreen mode="reset" token={token}/>; }
