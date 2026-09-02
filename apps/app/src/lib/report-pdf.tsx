import {
  Document,
  Font,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, PhrasingContent } from "mdast";
import type { ReportResponse, ResolvedProduct } from "@/lib/api-client";
import { isYogaLine, parseDietPlan, stripNonVegLabel, stripNoteLabel } from "@/lib/diet";
import { parseDoshaHero } from "@/lib/dosha";

// The downloadable report.
//
// This is the only artefact of the product that leaves the site — it gets
// forwarded to family, shown to a doctor, and re-read months later with no
// browser around it. So it has to stand on its own: say who made it, when, for
// whom, and what it is and isn't. The previous version was Helvetica on white
// with no marks, no colour and no structure, which read as a transcript rather
// than a document from a health brand.
//
// It deliberately mirrors the on-screen plan (src/app/report/[id]/page.tsx) —
// same three numbered movements (Understanding / Direction / Support), same
// diet grid, same disclaimer wording. Someone who read the page should
// recognise the PDF as the same thing, not a different summary.

/* ── Fonts ─────────────────────────────────────────────────────────────────
   Self-hosted from /public/fonts rather than fetched from fonts.gstatic.com at
   generation time: this runs in the user's browser when they click Save, and a
   third-party fetch there can fail (offline, blocked, corporate proxy) — which
   would silently drop the whole document back to Helvetica. TTF, not woff2:
   react-pdf's font parser doesn't read woff2. */
// In the browser these resolve same-origin against /public. Outside one (a
// script, or a future server-side render for emailing the report) there is no
// origin to resolve against, so fall back to the files on disk — react-pdf
// accepts either. Without this the document renders in Helvetica anywhere but
// the browser, silently.
const FONT_BASE =
  typeof window === "undefined" ? `${process.cwd()}/public/fonts` : "/fonts";

Font.register({
  family: "Newsreader",
  fonts: [
    { src: `${FONT_BASE}/Newsreader-400.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/Newsreader-500.ttf`, fontWeight: 500 },
    { src: `${FONT_BASE}/Newsreader-400Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
  ],
});
Font.register({
  family: "DMSans",
  fonts: [
    { src: `${FONT_BASE}/DMSans-400.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/DMSans-500.ttf`, fontWeight: 500 },
    { src: `${FONT_BASE}/DMSans-700.ttf`, fontWeight: 700 },
  ],
});
Font.register({
  family: "DMMono",
  fonts: [
    { src: `${FONT_BASE}/DMMono-400.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/DMMono-500.ttf`, fontWeight: 500 },
  ],
});

// Off by default in react-pdf's layout engine this produces breaks like
// "Ashwa-gandha" mid-column. Sanskrit and product names are exactly the words
// it gets wrong, so no hyphenation at all.
Font.registerHyphenationCallback((word) => [word]);

/* ── Tokens ────────────────────────────────────────────────────────────────
   The same palette as docs/redesign/brand-spec.md. Hairlines are flattened to
   opaque hex rather than rgba — the on-screen system uses --fg at 12%, and
   these are those values composited onto white, because a translucent border
   over a filled card renders differently in PDF than it does in CSS. */
const c = {
  bg: "#FFFFFF",
  surface: "#F4F7F5",
  surface2: "#EBF0EC",
  forest: "#15201A",
  muted: "#68736C",
  hairline: "#E1E5E2",
  hairlineSoft: "#EDEFEE",
  sage: "#A8C6B2",
  sageSoft: "#D8E5DD",
  primary: "#0C6B36",
  neutral: "#0A4F28",
  tertiary: "#FFF8F2",
  danger: "#9A5A45",
};

const PAGE_X = 44;

const s = StyleSheet.create({
  page: {
    paddingTop: 96,
    paddingBottom: 62,
    paddingHorizontal: PAGE_X,
    fontSize: 9.5,
    fontFamily: "DMSans",
    color: c.forest,
    // NO `lineHeight` here, and none on `footerText`/`footerPage` either.
    //
    // Bisected against react-pdf 4.5.1: any lineHeight that reaches the
    // absolutely-positioned `fixed` footer — inherited from this Page style, or
    // set directly on its child Texts — collapses the View's computed height,
    // and it then paints nothing at all on every page. No error, no warning;
    // the footer is simply absent. Line-height therefore lives on the
    // individual text styles below, which is where it belongs anyway, and the
    // footer's own text deliberately has none.
  },

  /* Page furniture — repeated on every page via `fixed`. */
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 62,
    backgroundColor: c.forest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PAGE_X,
  },
  wordmark: { flexDirection: "row", alignItems: "center", gap: 7 },
  wordmarkText: { fontFamily: "Newsreader", fontSize: 15, color: "#FFFFFF" },
  headerMeta: {
    fontFamily: "DMMono",
    fontSize: 6.6,
    letterSpacing: 1.1,
    color: c.sage,
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: PAGE_X,
    right: PAGE_X,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: c.muted },
  footerPage: { fontFamily: "DMMono", fontSize: 7, color: c.muted },

  /* Title block */
  eyebrow: {
    fontFamily: "DMMono",
    fontSize: 7,
    fontWeight: 500,
    letterSpacing: 1.2,
    color: c.primary,
  },
  h1: {
    fontFamily: "Newsreader",
    fontSize: 26,
    lineHeight: 1.12,
    marginTop: 8,
    maxWidth: 380,
  },
  metaRow: { flexDirection: "row", gap: 22, marginTop: 12, marginBottom: 16 },
  metaKey: {
    fontFamily: "DMMono",
    fontSize: 6.4,
    letterSpacing: 1,
    color: c.muted,
    marginBottom: 2,
  },
  metaVal: { fontSize: 9, lineHeight: 1.4, fontWeight: 500 },

  /* Disclaimer */
  disclaimer: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: 6,
    padding: 11,
    marginBottom: 22,
  },
  disclaimerText: { fontSize: 8.2, color: c.muted, lineHeight: 1.5 },

  /* Section heads — "01  Understanding — here's you" */
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 9,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.hairlineSoft,
    paddingBottom: 6,
  },
  sectionNum: {
    fontFamily: "DMMono",
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: c.primary,
  },
  sectionTitle: { fontFamily: "Newsreader", fontSize: 15, lineHeight: 1.2, flex: 1 },
  sectionTag: { fontSize: 7.2, color: c.muted },
  section: { marginBottom: 22 },

  /* Cards */
  card: {
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: 6,
    padding: 13,
    backgroundColor: c.bg,
  },
  cardKey: {
    fontFamily: "DMMono",
    fontSize: 6.4,
    letterSpacing: 1,
    color: c.primary,
    marginBottom: 5,
  },
  cardValue: { fontFamily: "Newsreader", fontSize: 17, lineHeight: 1.2, marginBottom: 4 },
  cardBody: { fontSize: 8.6, color: c.muted, lineHeight: 1.5 },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 7 },
  badge: {
    borderWidth: 1,
    borderColor: c.sage,
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    fontSize: 7.4,
    color: c.neutral,
  },
  tag: {
    borderWidth: 1,
    borderColor: c.hairline,
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 6.8,
    color: c.muted,
  },

  /* Diet grid — flex-wrapped rather than CSS grid, which react-pdf has no
     concept of. Two columns at 50% is the widest that keeps a meal's options
     on one line each at A4. */
  dietGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dietCell: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: 6,
    padding: 10,
    backgroundColor: c.bg,
  },
  dietSlot: {
    fontFamily: "DMMono",
    fontSize: 6.4,
    letterSpacing: 1,
    color: c.primary,
    marginBottom: 5,
  },
  dietItem: { flexDirection: "row", marginBottom: 3.5 },
  dietDot: {
    width: 2.6,
    height: 2.6,
    borderRadius: 2,
    backgroundColor: c.sage,
    marginTop: 4.5,
    marginRight: 6,
  },
  dietItemText: { flex: 1, fontSize: 8.2, lineHeight: 1.45 },
  /* Inline tag on a non-veg alternative item so it reads as a swap, not a second
     dish — the print counterpart of the web report's "Non-veg" badge. */
  dietNonVegTag: {
    fontFamily: "Courier",
    fontSize: 6.4,
    color: c.primary,
    letterSpacing: 0.4,
  },
  dietNote: { fontSize: 7.4, color: c.muted, marginTop: 8, lineHeight: 1.5 },

  /* Supportive (non-food) text: meal Benefits/Purpose, and the day-wide advice
     bands. Smaller and muted, with no bullet dot — it is not something to eat,
     and matching the food bullets made it read as another option. */
  dietSupport: {
    fontSize: 7.2,
    color: c.muted,
    lineHeight: 1.45,
    marginTop: 3,
  },
  dietSupportDivider: {
    borderTopWidth: 0.5,
    borderTopColor: c.hairline,
    marginTop: 6,
    paddingTop: 5,
  },
  adviceBand: {
    borderWidth: 0.5,
    borderColor: c.hairline,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    backgroundColor: c.surface,
  },

  /* Product cards */
  productCard: {
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    backgroundColor: c.bg,
  },
  productTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 4,
  },
  productName: { fontFamily: "Newsreader", fontSize: 12.5, lineHeight: 1.25, flex: 1 },
  productPurpose: { fontSize: 8.4, color: c.muted, lineHeight: 1.5 },
  productFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.hairlineSoft,
    paddingTop: 7,
  },
  price: { fontFamily: "Newsreader", fontSize: 12 },
  flag: {
    fontFamily: "DMMono",
    fontSize: 6.2,
    letterSpacing: 0.6,
    borderRadius: 20,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
  },

  /* Closing band */
  closing: {
    backgroundColor: c.forest,
    borderRadius: 8,
    padding: 16,
    marginTop: 4,
  },
  closingEyebrow: {
    fontFamily: "DMMono",
    fontSize: 6.6,
    letterSpacing: 1.2,
    color: c.sage,
    marginBottom: 6,
  },
  closingTitle: { fontFamily: "Newsreader", fontSize: 15, lineHeight: 1.25, color: "#FFFFFF" },
  closingBody: { fontSize: 8.2, color: c.surface, opacity: 0.8, marginTop: 5, lineHeight: 1.5 },

  /* Markdown */
  paragraph: { marginBottom: 6, fontSize: 9, lineHeight: 1.6 },
  mdHeading: { fontFamily: "Newsreader", fontSize: 11, marginTop: 9, marginBottom: 4 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 11, fontSize: 9, color: c.primary },
  listItemText: { flex: 1, fontSize: 9, lineHeight: 1.5 },
  bold: { fontWeight: 700 },
  italic: { fontStyle: "italic" },
});

/** The sprout mark, redrawn as PDF vector so it stays sharp at any zoom. */
function BrandMark({ size = 15, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20v-8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path
        d="M12 12c0-3-2-5-6-5 0 4 2 5 6 5Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M12 13c0-3 2-4 5-4 0 3-2 4-5 4Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ── Markdown ──────────────────────────────────────────────────────────── */

function renderInline(nodes: PhrasingContent[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case "text":
        return <Text key={key}>{node.value}</Text>;
      case "strong":
        return (
          <Text key={key} style={s.bold}>
            {renderInline(node.children, key)}
          </Text>
        );
      case "emphasis":
        return (
          <Text key={key} style={s.italic}>
            {renderInline(node.children, key)}
          </Text>
        );
      case "inlineCode":
        return <Text key={key}>{node.value}</Text>;
      case "break":
        return <Text key={key}>{"\n"}</Text>;
      default:
        return null;
    }
  });
}

function renderBlocks(nodes: RootContent[]): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  nodes.forEach((node, i) => {
    const key = `b-${i}`;
    if (node.type === "paragraph") {
      blocks.push(
        <Text key={key} style={s.paragraph}>
          {renderInline(node.children, key)}
        </Text>,
      );
    } else if (node.type === "heading") {
      blocks.push(
        <Text key={key} style={s.mdHeading}>
          {renderInline(node.children, key)}
        </Text>,
      );
    } else if (node.type === "list") {
      node.children.forEach((item, j) => {
        const itemKey = `${key}-${j}`;
        const marker = node.ordered ? `${(node.start ?? 1) + j}.` : "•";
        blocks.push(
          <View key={itemKey} style={s.listItem}>
            <Text style={s.bullet}>{marker}</Text>
            <Text style={s.listItemText}>
              {item.children.flatMap((child, k) =>
                child.type === "paragraph" ? renderInline(child.children, `${itemKey}-${k}`) : [],
              )}
            </Text>
          </View>,
        );
      });
    } else if (node.type === "thematicBreak") {
      blocks.push(
        <View
          key={key}
          style={{ borderBottomWidth: 1, borderBottomColor: c.hairlineSoft, marginVertical: 8 }}
        />,
      );
    }
  });
  return blocks;
}

function MarkdownPdf({ children }: { children: string }) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(children) as Root;
  return <>{renderBlocks(tree.children)}</>;
}

/* ── Pieces ────────────────────────────────────────────────────────────── */

/**
 * The repeated header band and footer rule.
 *
 * Must be rendered as the LAST children of a Page, not the first. react-pdf
 * paints in document order and has no z-index, so declaring these up top put
 * them *under* the content — the opaque white card backgrounds in the diet grid
 * and product list then painted straight over the footer and it vanished from
 * every page. The header only survived because `paddingTop` keeps content out
 * of its band.
 */
function PageFurniture() {
  return (
    <>
      <View style={s.header} fixed>
        <View style={s.wordmark}>
          <BrandMark />
          <Text style={s.wordmarkText}>Strengthiva</Text>
        </View>
        <Text style={s.headerMeta}>AYURVEDIC READING</Text>
      </View>
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          Educational wellness guidance — not a medical diagnosis.
        </Text>
        <Text
          style={s.footerPage}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </>
  );
}

function SectionHead({ n, title, tag }: { n: string; title: string; tag?: string }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionNum}>{n}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      {tag ? <Text style={s.sectionTag}>{tag}</Text> : null}
    </View>
  );
}

function statusFlag(resolution: ResolvedProduct["resolution"]) {
  if (resolution.status === "resolved")
    return { label: "IN STOCK", bg: c.surface2, fg: c.neutral };
  return { label: "IN-STORE ONLY", bg: c.tertiary, fg: c.danger };
}

/* ── Document ──────────────────────────────────────────────────────────── */

/**
 * One supportive line for the PDF.
 *
 * react-pdf renders no SVG icon components, so the on-screen flower marker
 * becomes a text glyph here rather than being dropped — the whole point of the
 * marker is that yoga advice is findable at a glance, and that has to survive
 * the download. The label is kept inline ("Benefits: …") because react-pdf has
 * no cheap way to mix weights inside one wrapped paragraph.
 */
function pdfSupportLine(line: string): string {
  const { label, text } = stripNoteLabel(line);
  const body = label ? `${label}: ${text}` : text;
  return isYogaLine(text) ? `❋  ${body}` : body;
}

export function ReportDocument({ report }: { report: ReportResponse }) {
  const hero = parseDoshaHero(report.dosha);
  const diet = parseDietPlan(report.diet);
  // No Date.now() fallback here. Two reasons: calling it during render is impure, so
  // the same report could render a different date on a re-render; and created_at is a
  // required field, so falling back to "today" would quietly stamp the PDF with a date
  // that isn't the issue date. If it is ever genuinely missing, say so rather than
  // inventing one.
  const issued = report.created_at
    ? new Date(report.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <Document
      title={`Strengthiva — Ayurvedic reading (${issued})`}
      author="Strengthiva"
      subject="Personalised Ayurvedic reading and daily plan"
      creator="Strengthiva"
      producer="Strengthiva"
    >
      <Page size="A4" style={s.page}>
        {/* Title block */}
        <Text style={s.eyebrow}>YOUR PLAN · BUILT FOR YOU</Text>
        <Text style={s.h1}>Here&rsquo;s you, and what supports you.</Text>

        <View style={s.metaRow}>
          <View>
            <Text style={s.metaKey}>ISSUED</Text>
            <Text style={s.metaVal}>{issued}</Text>
          </View>
          <View>
            <Text style={s.metaKey}>CONSTITUTION</Text>
            <Text style={s.metaVal}>{hero.name}</Text>
          </View>
          <View>
            <Text style={s.metaKey}>REFERENCE</Text>
            <Text style={s.metaVal}>{report.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            This is educational wellness guidance, not a medical diagnosis. For any medical
            decision — especially around medications or a diagnosed condition — please consult
            a qualified professional. Strengthiva is a wellness and education product, not a
            medical or diagnostic service.
          </Text>
        </View>

        {/* 01 — Understanding */}
        <View style={s.section}>
          <SectionHead n="01" title="Understanding — here's you" />
          <View style={s.card} wrap={false}>
            <Text style={s.cardKey}>YOUR CONSTITUTION</Text>
            <Text style={s.cardValue}>{hero.name}</Text>
            <Text style={s.cardBody}>{hero.blurb}</Text>
            {hero.components.length > 0 && (
              <View style={s.badgeRow}>
                {hero.components.map((d) => (
                  <Text key={d} style={s.badge}>
                    {d}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={{ marginTop: 9 }}>
            <MarkdownPdf>{report.summary}</MarkdownPdf>
          </View>
        </View>

        {/* 02 — Direction */}
        <View style={s.section}>
          <SectionHead
            n="02"
            title="Direction — here's your diet"
            tag="A day, built around your reading"
          />
          {diet ? (
            <>
              <View style={s.dietGrid}>
                {diet.slots.map((slot) => (
                  <View key={slot.label} style={s.dietCell} wrap={false}>
                    <Text style={s.dietSlot}>{slot.label.toUpperCase()}</Text>
                    {slot.items.map((item, i) => {
                      const { isNonVeg, text } = stripNonVegLabel(item);
                      return (
                        <View key={i} style={s.dietItem}>
                          <View style={s.dietDot} />
                          <Text style={s.dietItemText}>
                            {isNonVeg ? <Text style={s.dietNonVegTag}>NON-VEG  </Text> : null}
                            {text}
                          </Text>
                        </View>
                      );
                    })}
                    {slot.notes.length > 0 && (
                      <View style={s.dietSupportDivider}>
                        {slot.notes.map((note, i) => (
                          <Text key={i} style={s.dietSupport}>
                            {pdfSupportLine(note)}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
              {diet.advice.map((section) => (
                <View key={section.label} style={s.adviceBand} wrap={false}>
                  <Text style={s.dietSlot}>{section.label.toUpperCase()}</Text>
                  {[...section.items, ...section.notes].map((line, i) => (
                    <Text key={i} style={s.dietSupport}>
                      {pdfSupportLine(line)}
                    </Text>
                  ))}
                </View>
              ))}
              {diet.note ? <Text style={s.dietNote}>{diet.note}</Text> : null}
            </>
          ) : (
            // Same fallback contract as the on-screen page: if the model didn't
            // follow the slot format, render the plan as prose rather than a
            // half-populated grid.
            <MarkdownPdf>{report.diet}</MarkdownPdf>
          )}
        </View>

        {/* 03 — Support */}
        <View style={s.section}>
          <SectionHead
            n="03"
            title="Support — only what's needed"
            tag="After the plan, never before"
          />
          {report.product_disclaimer ? (
            <View style={[s.card, { backgroundColor: c.tertiary }]}>
              <Text style={s.cardBody}>{report.product_disclaimer}</Text>
            </View>
          ) : report.products.length === 0 ? (
            <Text style={s.cardBody}>
              Nothing to add right now — your plan is the diet and the routine above.
            </Text>
          ) : (
            report.products.map((product, i) => {
              const flag = statusFlag(product.resolution);
              const resolved =
                product.resolution.status === "resolved" ? product.resolution : null;
              return (
                <View key={`${product.name}-${i}`} style={s.productCard} wrap={false}>
                  <View style={s.productTop}>
                    <Text style={s.productName}>{product.name}</Text>
                    <Text style={[s.flag, { backgroundColor: flag.bg, color: flag.fg }]}>
                      {flag.label}
                    </Text>
                  </View>
                  {product.purpose ? (
                    <Text style={s.productPurpose}>{product.purpose}</Text>
                  ) : null}
                  {product.conditions && product.conditions.length > 0 ? (
                    <View style={s.badgeRow}>
                      {product.conditions.map((t) => (
                        <Text key={t} style={s.tag}>
                          {t}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <View style={s.productFoot}>
                    <Text style={s.price}>
                      {resolved && resolved.price !== null
                        ? `${resolved.currency_code?.toUpperCase() ?? ""} ${resolved.price}`
                        : "Available in store"}
                    </Text>
                    <Text style={{ fontSize: 7.4, color: c.muted }}>
                      {resolved
                        ? "Order at store.strengthiva.com"
                        : "Ask for it by name at a Strengthiva store"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <PageFurniture />
      </Page>

      {/* The full reading, given its own page — it is the longest section and
          the one a practitioner is most likely to want on its own sheet. */}
      <Page size="A4" style={s.page}>
        <SectionHead n="04" title="The full reading" tag={hero.name} />
        <MarkdownPdf>{report.dosha}</MarkdownPdf>

        {/* Closing band ends the document rather than the first page — placed
            after section 03 it fell just short of the remaining space and
            orphaned onto a page of its own that was 90% white. */}
        <View style={s.closing} wrap={false}>
          <Text style={s.closingEyebrow}>WHAT NEXT</Text>
          <Text style={s.closingTitle}>Health changes — so should the plan.</Text>
          <Text style={s.closingBody}>
            Reassess in a few weeks and this reading will be rebuilt around wherever your
            balance has moved to. Your plan is yours whether or not you ever buy anything.
          </Text>
        </View>

        <PageFurniture />
      </Page>
    </Document>
  );
}
