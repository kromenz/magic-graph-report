import fs from "fs/promises";
import neo4j from "neo4j-driver";
import puppeteer from "puppeteer";

const NEO4J_URI = "bolt://localhost:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASS = "testpassword";

const HEADER_HEIGHT_MM = 15;
const PDF_MARGIN_TOP = `${HEADER_HEIGHT_MM}mm`;

const mtgSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 100 100'>
  <circle cx='50' cy='50' r='48' fill='#0b3d91'/>
  <text x='50' y='58' font-family='Georgia, serif' font-size='28' fill='white' text-anchor='middle'>MTG</text>
</svg>`;

const headerTemplate = `
  <style>
    .pdf-header { width: 100%; height: ${HEADER_HEIGHT_MM}mm; box-sizing: border-box; font-family: Georgia, serif; }
    .header-inner { position: relative; width: 100%; height: 100%; padding: 6px 14px; }
    img.mtg-icon { position: absolute; top: 6px; right: 14px; height: calc(${HEADER_HEIGHT_MM}mm - 12px); }
    img.mtg-icon[data-page]:not([data-page="1"]) { display: none; }
  </style>
  <div class="pdf-header">
    <div class="header-inner">
      <img class="mtg-icon" data-page="{{pageNumber}}" src="data:image/svg+xml;utf8,${encodeURIComponent(
        mtgSvg
      )}" />
    </div>
  </div>
`;

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASS)
);

async function fetchData() {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:Card)-[:IN_SET]->(s:Set)
      WHERE s.code IN ['ltr', 'tmt']
      RETURN c.name AS name, c.cmc AS cmc, c.rarity AS rarity, c.oracle_text AS text, c.image AS image
      ORDER BY c.cmc DESC
      LIMIT 50
      `
    );
    return result.records.map((r) => ({
      name: r.get("name"),
      cmc: r.get("cmc").toNumber ? r.get("cmc").toNumber() : r.get("cmc"),
      rarity: r.get("rarity"),
      text: r.get("text"),
      image: r.get("image") ?? "No image",
    }));
  } finally {
    await session.close();
  }
}

function renderHtml(cards: any[]) {
  const rows = cards
    .map(
      (card) => `
    <div class="card">
      <img src="${card.image ?? ""}" alt="${card.name}" />
      <div class="meta">
        <h3>${card.name} <small>(${card.rarity})</small></h3>
        <p>CMC: ${card.cmc}</p>
        <p>${card.text ?? ""}</p>
      </div>
    </div>
  `
    )
    .join("\n");

  return `
  <!doctype html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
        html, body {
            height: 100%;
            margin: 0;
            font-family: "Georgia", "Times New Roman", serif;
            color: #222;
            background: #fff;
        }

        header.report-header {
            margin-bottom: 8mm;
            text-align: center;
        }
        header.report-header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        header.report-header p {
            font-size: 12px;
            color: #555;
        }

        .card {
            display: flex;
            gap: 14px;
            margin-bottom: 14px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e6e6e6;
            page-break-inside: avoid;
        }

        .card img {
            width: 120px;
            height: auto;
            object-fit: cover;
            border: 1px solid #ddd;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            border-radius: 4px;
        }

        .meta {
            flex: 1;
            min-width: 0;
        }
        .meta h3 {
            margin: 0 0 6px 0;
            font-size: 14px;
        }
        .meta .meta-row {
            margin: 2px 0;
            font-size: 12px;
            color: #333;
        }
        .meta .oracle {
            margin-top: 8px;
            font-size: 11.5px;
            color: #444;
            line-height: 1.35;
        }

        .content-footer-space {
            height: 10mm; /* helps ensure content doesn't touch PDF footer area */
        }

        @media print {
            .container { padding: 24mm 16mm; }
        }
        </style>
    </head>
    <body>
        <div class="container">
        <header class="report-header">
            <h1>Report — Top Cards</h1>
            <p>Generated report — selection of top cards and key properties</p>
        </header>

        ${rows}

        <div class="content-footer-space"></div>
        </div>
    </body>
    </html>
  `;
}

async function generatePdf(htmlString: string, outPath = "magic-report.pdf") {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setContent(htmlString, { waitUntil: "networkidle0" });

  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    margin: {
      top: PDF_MARGIN_TOP,
      left: "16mm",
      right: "16mm",
    },
  });

  await browser.close();
}

async function main() {
  const cards = await fetchData();
  const html = renderHtml(cards);
  await fs.writeFile("report.html", html);
  await generatePdf(html, "magic-report.pdf");
  console.log("PDF gerado: magic-report.pdf");
  await driver.close();
}

main().catch(console.error);
