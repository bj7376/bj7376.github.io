import type { Metadata } from "next";
import { AdminBirdingUploader } from "@/components/AdminBirdingUploader";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <section className="admin-page">
      <header className="admin-header">
        <h1>Birding data</h1>
        <p>Upload complete CSV exports. Existing Macaulay assets and eBird checklists are updated by their IDs.</p>
      </header>
      <AdminBirdingUploader />
    </section>
  );
}
