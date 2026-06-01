import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { listPublicDocs } from "@/lib/docs";

export const metadata = {
  title: "Learn — श्रमदान",
  description: "In-app docs reader: intro, philosophy, how shramdan works, and more."
};

export default async function LearnIndexPage() {
  const docs = await listPublicDocs();
  return (
    <SiteShell>
      <section className="page-section learn-section">
        <header className="learn-header">
          <p className="eyebrow">Learn</p>
          <h1>श्रमदान documents</h1>
          <p className="learn-lead">
            Start with <Link href="/learn/00-intro">the intro</Link>. From there, jump to whichever
            topic calls.
          </p>
        </header>
        <ul className="learn-index">
          {docs.map((doc) => (
            <li key={doc.slug}>
              <Link className="learn-index-link" href={`/learn/${doc.slug}`}>
                <span className="learn-index-slug">{doc.slug}</span>
                <span className="learn-index-title">{doc.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
