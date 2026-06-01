import { marked } from "marked";

// Server-side markdown renderer for the in-app /learn docs reader.
// Content comes from a filesystem-controlled allowlist (docs/public/*.md)
// so it is safe to render the resulting HTML directly. No JSX execution.
//
// GFM + breaks enabled to match expected doc authoring conventions.
marked.use({ gfm: true, breaks: false });

export function MarkdownReader({ content }) {
  const html = marked.parse(content);
  return (
    <div
      className="learn-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
