"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
function isActive(pathname:string,href:string){ if(href==="/") return pathname==="/"; return pathname.startsWith(href); }
export function SiteHeader(){ const pathname=usePathname(); return <header className="site-header"><Link className="brand" href="/">{siteConfig.name}</Link><nav aria-label="Primary navigation">{siteConfig.nav.map((item)=><Link className={isActive(pathname,item.href)?"active":""} key={item.href} href={item.href}>{item.label}</Link>)}<span className="search-glyph" aria-hidden="true" /></nav></header>; }
