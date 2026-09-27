// Ajoute à la base Notion les propriétés dont l'app a besoin :
//   traite_le (date), traite_par (select Hiba / Romain), score_priorite (formule).
// Idempotent : ne crée que ce qui manque et ne touche à aucune fiche.
//
//   npm run notion:migrate            → affiche ce qui serait fait (dry-run)
//   npm run notion:migrate -- --apply → applique
import { pathToFileURL } from "node:url";

const NOTION_VERSION = "2025-09-03";

// Miroir de PRIORITY_FORMULA (lib/domain/priority.ts) ; un test vérifie l'égalité.
export const PRIORITY_FORMULA = [
  `if(prop("segment") == "structure_employeuse", 3, 0)`,
  `ifs(prop("effectif") == "03", 3, prop("effectif") == "02", 2, prop("effectif") == "01", 1, 0)`,
  `if(empty(prop("enseigne")), 0, 2)`,
  `if(empty(prop("date_creation")), 0, if(year(prop("date_creation")) < 2024, 1, if(year(prop("date_creation")) >= 2025, -2, 0)))`,
].join(" + ");

export const OPERATORS = ["Hiba", "Romain"];

// Calcule le PATCH de schéma à appliquer à partir des propriétés existantes.
export function planMigration(existing) {
  const changes = {};
  const log = [];

  if (!existing.traite_le) {
    changes.traite_le = { date: {} };
    log.push("+ traite_le (date)");
  } else if (existing.traite_le.type !== "date") {
    throw new Error(`traite_le existe mais est de type ${existing.traite_le.type}`);
  }

  if (!existing.traite_par) {
    changes.traite_par = { select: { options: OPERATORS.map((name) => ({ name })) } };
    log.push(`+ traite_par (select : ${OPERATORS.join(", ")})`);
  } else if (existing.traite_par.type !== "select") {
    throw new Error(`traite_par existe mais est de type ${existing.traite_par.type}`);
  } else {
    const names = existing.traite_par.select.options.map((o) => o.name);
    const missing = OPERATORS.filter((o) => !names.includes(o));
    if (missing.length > 0) {
      changes.traite_par = { select: { options: [...existing.traite_par.select.options, ...missing.map((name) => ({ name }))] } };
      log.push(`~ traite_par : ajout des options ${missing.join(", ")}`);
    }
  }

  if (!existing.score_priorite) {
    changes.score_priorite = { formula: { expression: PRIORITY_FORMULA } };
    log.push("+ score_priorite (formule)");
  } else if (existing.score_priorite.type !== "formula") {
    throw new Error(`score_priorite existe mais est de type ${existing.score_priorite.type}`);
  }

  return { changes, log };
}

async function notion(path, init = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Notion ${res.status} : ${JSON.stringify(body)}`);
  return body;
}

function describe(props) {
  for (const name of ["traite_le", "traite_par", "score_priorite"]) {
    const p = props[name];
    if (!p) console.log(`  ${name.padEnd(15)} absente`);
    else if (p.type === "select") console.log(`  ${name.padEnd(15)} select [${p.select.options.map((o) => o.name).join(", ")}]`);
    else if (p.type === "formula") console.log(`  ${name.padEnd(15)} formula ${p.formula.expression}`);
    else console.log(`  ${name.padEnd(15)} ${p.type}`);
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const id = process.env.NOTION_DATA_SOURCE_ID;
  if (!process.env.NOTION_API_KEY || !id) throw new Error("NOTION_API_KEY et NOTION_DATA_SOURCE_ID requis");

  const before = await notion(`/data_sources/${id}`);
  console.log(`Base : ${before.title?.map((t) => t.plain_text).join("") ?? id} — ${Object.keys(before.properties).length} propriétés`);
  console.log("Avant :");
  describe(before.properties);

  const { changes, log } = planMigration(before.properties);
  if (log.length === 0) {
    console.log("Rien à faire, le schéma est à jour.");
    return;
  }
  console.log("Changements :");
  for (const line of log) console.log(`  ${line}`);
  if (!apply) {
    console.log("Dry-run : relancer avec --apply pour appliquer.");
    return;
  }

  await notion(`/data_sources/${id}`, { method: "PATCH", body: JSON.stringify({ properties: changes }) });
  const after = await notion(`/data_sources/${id}`);
  console.log(`Après : ${Object.keys(after.properties).length} propriétés`);
  describe(after.properties);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
