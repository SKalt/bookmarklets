import { selectElement } from "./lib/html";
import { copyToClipboard, Logger } from "./lib/lib";
import { defaultCallbacks, toMd } from "./lib/markdown";
const logger = new Logger("to_md");

(async () => {
  const element = await selectElement(logger);
  if (!element) {
    logger.err("No element selected");
    return;
  }
  const md = toMd(element.innerHTML, defaultCallbacks, logger);
  console.log(md);
  try {
    await copyToClipboard(md);
    alert("markdown copied to clipboard");
  } catch (e) {
    logger.err("can't write to clipboard", e);
  }
})();
