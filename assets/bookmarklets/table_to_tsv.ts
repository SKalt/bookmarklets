// This bookmarklet converts a HTML table to a TSV file
import { selectElement, textOf } from "./lib/html";
import { escapeTsvValue, Logger } from "./lib/lib";
(async () => {
  const log = new Logger("table_to_tsv");
  const rootEl = (await selectElement(log)) ?? document.body;
  const table =
    rootEl.tagName === "TABLE" ? rootEl : rootEl.querySelector("table");
  let results = [];
  const headEl = table?.querySelector("thead");
  const bodyEl = table?.querySelector("tbody");
  const rows = Array.from(table?.querySelectorAll("tr") ?? []).map((tr) =>
    Array.from(tr.querySelectorAll("td, th")).map((td) =>
      escapeTsvValue(textOf(td).trim())
    )
  );
  console.log(rows);
  console.log(rows.map((r) => r.join("\t")).join("\n"));
})();

// await (async () => {
//   let rootEl = $0;
//   /** @type {HTMLTableElement} */
//   const table =
//     rootEl.tagName === "TABLE" ? rootEl : rootEl.querySelector("table");
//   console.log(table);
//   let results = [];
//   const headEl = table?.querySelector("thead");
//   const bodyEl = table?.querySelector("tbody");
//   const rows = Array.from(table?.querySelectorAll("tr") ?? []).map((tr) =>
//     Array.from(tr.querySelectorAll("td, th")).map((td) => td.textContent)
//   );
//   console.log(rows);
// })();
