import { siteConfig } from "@/lib/site-config";
export function SiteFooter(){ return <footer className="site-footer"><span>© 2026 Byoungjae Kim</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></footer>; }
