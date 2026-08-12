/**
 * Server component that emits one or more JSON-LD blocks. Renders a static
 * <script type="application/ld+json"> tag — Google reads these straight from
 * the initial HTML, no JS execution required.
 *
 * Usage:
 *   <JsonLd data={organizationLd()} />
 *   <JsonLd data={[serviceLd(p, "/plans/presence"), breadcrumbLd([...])]} />
 */

type Props = {
  data: object | object[];
};

export function JsonLd({ data }: Props) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // The content is built from siteConfig (trusted) — no user input
          // ever reaches this serializer.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
