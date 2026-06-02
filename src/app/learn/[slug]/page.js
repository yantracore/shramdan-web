import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { MarkdownReader } from "@/components/MarkdownReader";
import { getPublicDoc, listPublicDocs } from "@/lib/docs";

export async function generateStaticParams() {
  const docs = await listPublicDocs();
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const doc = await getPublicDoc(slug);
  if (!doc) return { title: "Not found — श्रमदान" };
  return {
    title: `${doc.title} — श्रमदान Learn`,
    description: `${doc.title}: श्रमदान docs reader`
  };
}

// Rough mixed-script reading time — Devanagari + Latin both counted as
// "words" by whitespace split. ~220 words/min is a calm reading pace
// for mixed-script prose. Returns at least 1 minute.
function estimateReadingMinutes(content) {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function LearnDocPage({ params }) {
  const { slug } = await params;
  const doc = await getPublicDoc(slug);
  if (!doc) notFound();

  // Prev / next nav — uses the same sorted list as the index page,
  // so cycling through docs feels predictable.
  const allDocs = await listPublicDocs();
  const currentIdx = allDocs.findIndex((d) => d.slug === slug);
  const prevDoc = currentIdx > 0 ? allDocs[currentIdx - 1] : null;
  const nextDoc = currentIdx >= 0 && currentIdx < allDocs.length - 1
    ? allDocs[currentIdx + 1]
    : null;

  const readingMinutes = estimateReadingMinutes(doc.content);

  return (
    <SiteShell>
      <article className="page-section learn-section learn-reader">
        <nav className="learn-breadcrumb">
          <Link href="/learn">
            <span aria-hidden="true">←</span> All documents
          </Link>
        </nav>

        <p className="learn-reader-meta">
          <span>{readingMinutes} min read</span>
          <span aria-hidden="true"> · </span>
          <span className="learn-reader-meta-slug">{slug}</span>
        </p>

        <MarkdownReader content={doc.content} />

        <nav
          className="learn-doc-nav"
          aria-label="Previous and next documents"
        >
          {prevDoc ? (
            <Link className="learn-doc-nav-link learn-doc-nav-prev" href={`/learn/${prevDoc.slug}`}>
              <span className="learn-doc-nav-direction">
                <span aria-hidden="true">←</span> Previous
              </span>
              <span className="learn-doc-nav-title">{prevDoc.title}</span>
            </Link>
          ) : (
            <span className="learn-doc-nav-link learn-doc-nav-empty" aria-hidden="true" />
          )}
          {nextDoc ? (
            <Link className="learn-doc-nav-link learn-doc-nav-next" href={`/learn/${nextDoc.slug}`}>
              <span className="learn-doc-nav-direction">
                Next <span aria-hidden="true">→</span>
              </span>
              <span className="learn-doc-nav-title">{nextDoc.title}</span>
            </Link>
          ) : (
            <span className="learn-doc-nav-link learn-doc-nav-empty" aria-hidden="true" />
          )}
        </nav>
      </article>
    </SiteShell>
  );
}
