import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, PhrasingContent } from "mdast";
import type { ReportResponse } from "@/lib/api-client";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", color: "#1a1a1a" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#555555", marginBottom: 20 },
  sectionHeading: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 8 },
  mdHeading: { fontSize: 11.5, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 4 },
  paragraph: { marginBottom: 6, lineHeight: 1.5 },
  listItem: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  bullet: { width: 12 },
  listItemText: { flex: 1, lineHeight: 1.4 },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  productCard: { borderWidth: 1, borderColor: "#dddddd", borderRadius: 4, padding: 10, marginBottom: 8 },
  productName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  productMeta: { fontSize: 9.5, color: "#444444", marginBottom: 2 },
  statusLine: { fontSize: 9, color: "#777777", marginTop: 2 },
});

function renderInline(nodes: PhrasingContent[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case "text":
        return <Text key={key}>{node.value}</Text>;
      case "strong":
        return (
          <Text key={key} style={styles.bold}>
            {renderInline(node.children, key)}
          </Text>
        );
      case "emphasis":
        return (
          <Text key={key} style={styles.italic}>
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
        <Text key={key} style={styles.paragraph}>
          {renderInline(node.children, key)}
        </Text>
      );
    } else if (node.type === "heading") {
      blocks.push(
        <Text key={key} style={styles.mdHeading}>
          {renderInline(node.children, key)}
        </Text>
      );
    } else if (node.type === "list") {
      node.children.forEach((item, j) => {
        const itemKey = `${key}-${j}`;
        const marker = node.ordered ? `${(node.start ?? 1) + j}.` : "•";
        blocks.push(
          <View key={itemKey} style={styles.listItem}>
            <Text style={styles.bullet}>{marker}</Text>
            <Text style={styles.listItemText}>
              {item.children.flatMap((child, k) =>
                child.type === "paragraph" ? renderInline(child.children, `${itemKey}-${k}`) : []
              )}
            </Text>
          </View>
        );
      });
    } else if (node.type === "thematicBreak") {
      blocks.push(<View key={key} style={{ borderBottomWidth: 1, borderColor: "#dddddd", marginVertical: 8 }} />);
    }
  });
  return blocks;
}

function MarkdownPdf({ children }: { children: string }) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(children) as Root;
  return <>{renderBlocks(tree.children)}</>;
}

export function ReportDocument({ report }: { report: ReportResponse }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Your Path to Vitality</Text>
        <Text style={styles.subtitle}>Personalised Ayurvedic health report — Strengthiva</Text>

        <Text style={styles.sectionHeading}>Ayurvedic Constitution</Text>
        <MarkdownPdf>{report.dosha}</MarkdownPdf>

        <Text style={styles.sectionHeading}>Summary</Text>
        <MarkdownPdf>{report.summary}</MarkdownPdf>

        <Text style={styles.sectionHeading}>Daily Diet Plan</Text>
        <MarkdownPdf>{report.diet}</MarkdownPdf>

        {report.products.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Therapeutic Recommendations</Text>
            {report.products.map((product, i) => (
              <View key={`${product.name}-${i}`} style={styles.productCard} wrap={false}>
                <Text style={styles.productName}>{product.name}</Text>
                {product.purpose && <Text style={styles.productMeta}>{product.purpose}</Text>}
                {product.conditions && product.conditions.length > 0 && (
                  <Text style={styles.productMeta}>Helps with: {product.conditions.join(", ")}</Text>
                )}
                {product.complement && <Text style={styles.productMeta}>{product.complement}</Text>}
                <Text style={styles.statusLine}>
                  {product.resolution.status === "resolved"
                    ? `In stock${
                        product.resolution.price !== null
                          ? ` — ${product.resolution.currency_code?.toUpperCase()} ${product.resolution.price}`
                          : ""
                      }`
                    : product.resolution.status === "out_of_stock"
                      ? "Out of stock online — available at Strengthiva stores"
                      : "Available at Strengthiva stores"}
                </Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
