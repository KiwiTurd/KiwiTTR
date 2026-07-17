import { useMemo, useState } from "react";

const DEFAULT_CHARACTER_LIMIT = 220;

function shortenedDescription(description: string, limit: number) {
  const initial = description.slice(0, limit).trimEnd();
  const lastSpace = initial.lastIndexOf(" ");

  return `${lastSpace > limit * 0.7 ? initial.slice(0, lastSpace) : initial}…`;
}

export default function ExpandableDescription({
  description,
  characterLimit = DEFAULT_CHARACTER_LIMIT,
}: {
  description: string;
  characterLimit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = description.length > characterLimit;
  const preview = useMemo(
    () => shortenedDescription(description, characterLimit),
    [characterLimit, description]
  );

  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700">
      <p className="whitespace-pre-line">
        {canExpand && !expanded ? preview : description}
      </p>
      {canExpand && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 font-semibold text-blue-700 transition hover:text-blue-900"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
