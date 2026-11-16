import { ButtonLink } from "@/components/ui/button";
export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <div className="empty-state"><span aria-hidden="true" className="empty-icon">↗</span><h2>{title}</h2><p>{description}</p>{href && action && <ButtonLink href={href}>{action}</ButtonLink>}</div>;
}
export function LoadingState() {
  return <div className="empty-state" role="status"><span className="loading-dot" aria-hidden="true" /><p>Getting things ready…</p></div>;
}
export function PreviewNotice({ children }: { children?: React.ReactNode }) {
  return <p className="preview-notice">Scaffold preview. {children ?? "Fictional examples only. Nothing is saved and no money is collected."}</p>;
}
