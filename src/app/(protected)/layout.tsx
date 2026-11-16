import Link from "next/link";
import { Container } from "@/components/layout/container";
import { workspaceLinks } from "@/constants/navigation";
// The route group organises pages only. Real access checks must be added before private data.
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <><Container><nav className="workspace-nav mt-8" aria-label="Workspace preview navigation">{workspaceLinks.map(link=><Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></Container>{children}</>;
}
