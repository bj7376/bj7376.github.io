import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/site-config";

export default function JournalPage() {
  if (!siteConfig.journalEnabled) notFound();
  return <section className="index-page"><h1>Journal</h1></section>;
}
