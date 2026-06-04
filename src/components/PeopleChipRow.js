// Avatar-initial chip row shared by /issues/[id] (supporters) and
// /events/[id] (participants). The two surfaces show conceptually the
// same thing — humans committed to an activity — at different lifecycle
// stages, so the chip presentation is identical and only the wrapping
// heading copy changes. `extraCount` covers the "+N more" tail when the
// authoritative count exceeds the array of named people we can show.

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

export function PeopleChipRow({
  title,
  intro,
  people,
  extraCount = 0,
  moreLabel = "+{n} more",
  language = "np",
  maxVisible = 12
}) {
  if (!Array.isArray(people) || people.length === 0) {
    if (!extraCount) return null;
  }
  const visible = (people || []).slice(0, maxVisible);
  const remaining =
    Math.max(0, (people?.length || 0) - visible.length) + Math.max(0, extraCount);

  return (
    <section
      className="public-issue-detail-section-block issue-supporters"
      aria-label={title}
    >
      {title ? <h2>{title}</h2> : null}
      {intro ? <p className="public-issue-detail-muted">{intro}</p> : null}
      <div className="issue-supporters-chips">
        {visible.map((person, i) => {
          const name =
            typeof person === "string" ? person : person?.name || "";
          const initial = Array.from(name.trim())[0] || "?";
          return (
            <span
              key={person?.id || `${name}-${i}`}
              className="issue-supporters-chip"
              title={name}
            >
              {initial}
            </span>
          );
        })}
        {remaining > 0 ? (
          <span className="issue-supporters-chip issue-supporters-chip-more">
            {moreLabel.replace("{n}", localizeDigits(remaining, language))}
          </span>
        ) : null}
      </div>
    </section>
  );
}
