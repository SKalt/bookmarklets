import { copyToClipboard, Logger } from "./lib/lib";
import { defaultCallbacks, toMd } from "./lib/markdown";
const logger = new Logger("to_md");
/**
 * Select the clicked HTML element
 * @returns The clicked HTML element
 */
const selectElement = async (): Promise<HTMLElement | null> =>
  new Promise((resolve, reject) => {
    const log = logger.child("selectElement");
    const handle = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      return event.target as HTMLElement;
    };
    const cancelSearch = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cleanUp();
        log.err("Search cancelled");
        reject(new Error("Search cancelled"));
      }
    };
    const onMouseOver = (event: MouseEvent) => {
      const element = handle(event);
      const prevBorder = element.style.border;
      element.style.border = "2px solid red";
      const onMouseOut = () => {
        element.style.border = prevBorder;
        element.removeEventListener("mouseout", onMouseOut);
      };
      element.addEventListener("mouseout", onMouseOut);
    };
    const onClick = (event: MouseEvent) => {
      const element = handle(event);
      cleanUp();
      resolve(element);
    };
    const cleanUp = () => {
      log.log("Cleaning up");
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", cancelSearch);
      document.removeEventListener("mouseover", onMouseOver);
    };
    document.addEventListener("mouseover", onMouseOver);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", cancelSearch);
  });

(async () => {
  const element = await selectElement();
  if (!element) {
    logger.err("No element selected");
    return;
  }
  const md = toMd(element.textContent, defaultCallbacks(), logger);
  console.log(md);
  try {
    await copyToClipboard(md);
    alert("markdown copied to clipboard");
  } catch (e) {
    logger.err("can't write to clipboard", e);
  }
})();
