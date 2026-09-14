import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">404</p>
      <h1>This section is not published.</h1>
      <Link href="/">Return home</Link>
    </section>
  );
}
