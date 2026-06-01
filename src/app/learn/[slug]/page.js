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

export default async function LearnDocPage({ params }) {
  const { slug } = await params;
  const doc = await getPublicDoc(slug);
  if (!doc) notFound();
  return (
    <SiteShell>
      <article className="page-section learn-section learn-reader">
        <nav className="learn-breadcrumb">
          <Link href="/learn">
            <span aria-hidden="true">←</span> All documents
          </Link>
        </nav>
        <MarkdownReader content={doc.content} />
      </article>
    </SiteShell>
  );
}
