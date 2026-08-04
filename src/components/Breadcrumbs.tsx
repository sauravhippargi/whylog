import Link from "next/link";

export type Crumb = {
  label: string;
  /** Omit on the final (current) crumb. */
  href?: string;
};

// Hierarchy strip for the shell's content header. Complements the sidebar
// rather than replacing it: the sidebar switches between projects, this shows
// where the current record sits and links back up to its parent.
//
// Styled per design.md — mono "log's voice", muted ancestor links that go brass
// on hover, current item in parchment.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span className="current" aria-current="page" title={item.label}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="sep" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
