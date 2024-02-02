import { Logger } from "./lib";

export type NodeCallbacks<Result> = Partial<{
  [Node.ATTRIBUTE_NODE]: (node: Attr) => Result;
  [Node.CDATA_SECTION_NODE]: (node: CDATASection) => Result;
  [Node.COMMENT_NODE]: (node: Comment) => Result;
  [Node.DOCUMENT_FRAGMENT_NODE]: (node: DocumentFragment) => Result;
  [Node.DOCUMENT_NODE]: (node: Document) => Result;
  [Node.TEXT_NODE]: (node: Node) => Result;
}> & { nodeFallback: (node: Node) => Result };

export const enum WrapKinds {
  Italic = 1 << 1,
  Bold = 1 << 2,
  Underline = 1 << 3,
}
export type Wrap = number & { readonly __wrap: unique symbol };
const bitFlag = (f: Wrap) => (n: Wrap) => (n & f) === f;
export const isItalic = bitFlag(WrapKinds.Italic as Wrap);
export const isBold = bitFlag(WrapKinds.Bold as Wrap);
export const isUnderline = bitFlag(WrapKinds.Underline as Wrap);

export type State = {
  /** for all block elements */
  indent: string;
  /** for `li`s only */
  prefix: string;
  wrap?: Wrap;
};
export type Callback<El extends HTMLElement = HTMLElement, Result = string> = (
  el: El,
  state: State,
  cb: Callbacks<Result>,
  logger: Logger | null
) => Result;

export type HtmlCallbacks<Result> = {
  [K in keyof HTMLElementTagNameMap]?: Callback<
    HTMLElementTagNameMap[K],
    Result
  >;
} & {
  htmlFallback: Callback<HTMLElement, Result>;
};

export type Callbacks<Result> = HtmlCallbacks<Result> & NodeCallbacks<Result>;
export const newline = (state: State) => "\n" + state.indent;
/**
 *
 * @param element root of the DOM tree to walk
 * @param callbacks how to handle each HTML node type
 * @param logger an optional logger
 * @returns One result per **child** node. Note the root node is not included in the result!
 */
export const walkNodes = <Result>(
  element: HTMLElement,
  state: State = { indent: "", prefix: "- ", wrap: 0 as Wrap },
  callbacks: Callbacks<Result>,
  logger?: Logger | null
): Result[] => {
  const log: Logger | null = globalThis.DEBUG
    ? logger?.child("walkNodes(" + element.tagName.toLowerCase() + ")")
    : null;
  return [...element.childNodes].map((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      log?.debug("element", element);
      const callback: Callback<HTMLElement, Result> =
        callbacks[element.tagName.toLowerCase()] || callbacks.htmlFallback;
      const result = callback(element, state, callbacks, logger);
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
export const textOf = (node: Node): string =>
  node.textContent?.replaceAll(/\r?\n/g, "\n").replaceAll("*", "\\*") || "";

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
    const chores: Array<() => void> = [];
    const onMouseOver = (event: MouseEvent) => {
      const element = handle(event);
      const prevBorder = element.style.border;
      element.style.border = "2px solid red";
      const cleanUp = () => {
        element.style.border = prevBorder;
        element.removeEventListener("mouseout", onMouseOut);
      };
      chores.push(cleanUp);
      const onMouseOut = () => chores.pop()?.();
      element.addEventListener("mouseout", onMouseOut);
    };
    const onClick = (event: MouseEvent) => {
      const element = handle(event);
      cleanUp();
      resolve(element);
    };
    const cleanUp = () => {
      log.info("Cleaning up");
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", cancelSearch);
      document.removeEventListener("mouseover", onMouseOver);
      while (chores.length) chores.pop()?.();
    };
    document.addEventListener("mouseover", onMouseOver);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", cancelSearch);
  });
