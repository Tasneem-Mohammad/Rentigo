import Link from "next/link";
import { Container } from "@/components/layout/container";
import { workspaceLinks } from "@/constants/navigation";
import { requireUser } from "@/server/auth/session";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <><Container><nav className="workspace-nav mt-8" aria-label="Workspace preview navigation">{workspaceLinks.map(link=><Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></Container>{children}</>;
}
