import { Logger } from "./lib";

export type NodeCallbacks<Result> = Partial<{
  [Node.ATTRIBUTE_NODE]: (node: Attr) => Result;
  [Node.CDATA_SECTION_NODE]: (node: CDATASection) => Result;
  [Node.COMMENT_NODE]: (node: Comment) => Result;
  [Node.DOCUMENT_FRAGMENT_NODE]: (node: DocumentFragment) => Result;
  [Node.DOCUMENT_NODE]: (node: Document) => Result;
  [Node.TEXT_NODE]: (node: Node) => Result;
}> & { nodeFallback: (node: Node) => Result };

export type HtmlCallbacks<Result> = {
  [K in keyof HTMLElementTagNameMap]?: (
    el: HTMLElementTagNameMap[K],
    callbacks: Callbacks<Result>
  ) => Result;
} & {
  htmlFallback: (el: HTMLElement, callbacks: Callbacks<Result>) => Result;
};
export type Callbacks<Result> = HtmlCallbacks<Result> & NodeCallbacks<Result>;

export const walkNodes = <Result>(
  element: HTMLElement,
  callbacks: Callbacks<Result>,
  logger?: Logger | null
): Result[] => {
  const log: Logger | null = globalThis.DEBUG
    ? logger?.child("walkNodes")
    : null;
  return [...element.childNodes].map((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      log?.debug("element", element);
      const callback =
        callbacks[element.tagName.toLowerCase()] || callbacks.htmlFallback;
      log?.debug("callback", callback);
      const result = callback(element, callbacks);
      log?.debug("result", result);
      return result;
    } else {
      const callback = callbacks[node.nodeType] || callbacks.nodeFallback;
      return callback(node);
    }
  });
};
export const stringToHtmlElement = (html: string): HTMLDivElement => {
  const tpl = document.createElement("template");
  tpl.innerHTML = `<div>${html}</div>`;
  const div = tpl.content.querySelector("div");
  return div;
};
export const textOf = (node: Node): string => node.textContent?.trim() || "";

/**
 * Select the clicked HTML element
 * @returns The clicked HTML element
 */
export const selectElement = async (
  logger: Logger
): Promise<HTMLElement | null> =>
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
