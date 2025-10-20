import neo4j from "neo4j-driver";

const NEO4J_URI = "bolt://localhost:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASS = "testpassword";

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASS)
);

type ScryfallCard = {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  oracle_text?: string;
  rarity?: string;
  set?: string;
  set_name?: string;
  image_uris?: { normal?: string; small?: string };
  all_parts?: any;
  type_line?: string;
  colors?: string[];
};

async function main() {
  const session = driver.session();

  try {
    // Exemplo: buscar cartas do set "khm" (Kaldheim). Podes mudar a query.
    // Scryfall: /cards/search?q=set:khm
    const res = await fetch("https://api.scryfall.com/cards/search?q=set:khm");
    const data = await res.json();

    if (!data || !data.data) {
      console.error("No cards returned", data);
      return;
    }

    for (const card of data.data as ScryfallCard[]) {
      await session.run(
        `
        MERGE (c:Card {id: $id})
        SET c.name = $name, c.mana_cost = $mana_cost, c.cmc = $cmc,
            c.oracle_text = $oracle_text, c.rarity = $rarity, c.image = $image
        `,
        {
          id: card.id,
          name: card.name,
          mana_cost: card.mana_cost ?? "",
          cmc: card.cmc ?? 0,
          oracle_text: card.oracle_text ?? "",
          rarity: card.rarity ?? "",
          image: card.image_uris?.normal ?? null,
        }
      );

      // Set
      if (card.set) {
        await session.run(
          `
          MERGE (s:Set {code: $set})
          SET s.name = $set_name
          WITH s
          MATCH (c:Card {id: $id})
          MERGE (c)-[:IN_SET]->(s)
          `,
          { set: card.set, set_name: card.set_name ?? "", id: card.id }
        );
      }

      // Types (type_line pode conter: "Creature — Human Warrior")
      if (card.type_line) {
        const types = card.type_line
          .split("—")[0]
          .split(" ")
          .map((t) => t.trim())
          .filter(Boolean);
        for (const t of types) {
          await session.run(
            `
            MERGE (tp:Type {name: $type})
            WITH tp
            MATCH (c:Card {id: $id})
            MERGE (c)-[:HAS_TYPE]->(tp)
            `,
            { type: t, id: card.id }
          );
        }
      }

      // Colors
      if (card.colors?.length) {
        for (const col of card.colors) {
          await session.run(
            `
            MERGE (col:Color {name: $color})
            WITH col
            MATCH (c:Card {id: $id})
            MERGE (c)-[:HAS_COLOR]->(col)
            `,
            { color: col, id: card.id }
          );
        }
      }
    }

    console.log("Seed complete");
  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
