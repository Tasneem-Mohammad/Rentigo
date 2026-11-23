"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Brand } from "./brand";
import { Icon } from "@/components/ui/icon";
import { LocationPicker } from "./location-picker";
import { AccountMenu } from "./account-menu";

export function Header({ authAvailable = false }: { authAvailable?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const links = [{ href: "/explore", label: "Explore rentals", active: pathname === "/" || pathname.startsWith("/explore") || pathname.startsWith("/items/") }, { href: "/#how-it-works", label: "How it works", active: false }, { href: "/dashboard", label: "Your space", active: pathname === "/dashboard" }];
  return <header className="site-header editorial-header" onKeyDown={event => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } }}><div className="header-inner">
    <div className="header-brand"><Brand/><LocationPicker/></div>
    <nav className="desktop-nav" aria-label="Main navigation">{links.map(link => <Link key={link.href} href={link.href} className={link.active ? "nav-active" : undefined} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</nav>
    <form action="/explore" className="header-search"><label className="sr-only" htmlFor="header-search">Search rental examples</label><Icon name="search" width="17" height="17"/><input id="header-search" name="q" type="search" placeholder="Find something useful…"/><button type="submit" aria-label="Search rentals"><Icon name="arrow" width="16" height="16"/></button></form>
    <div className="header-actions"><Link href="/listings/new" className="header-list-button">List an item</Link><AccountMenu enabled={authAvailable}/><button type="button" className="mobile-menu-toggle" ref={menuButton} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"}/></button></div>
  </div>{menuOpen && <nav id="mobile-menu" className="editorial-mobile-menu" aria-label="Mobile navigation">{[...links, { href: "/listings/new", label: "List an item", active: false }].map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}<Icon name="arrow" width="16" height="16"/></Link>)}<form action="/explore"><label htmlFor="mobile-search">Search rental examples</label><div className="mobile-search-field"><input id="mobile-search" type="search" name="q" placeholder="What would you like to rent?"/><button type="submit" aria-label="Search rentals"><Icon name="search"/></button></div></form><AccountMenu enabled={authAvailable}/></nav>}</header>;
}
