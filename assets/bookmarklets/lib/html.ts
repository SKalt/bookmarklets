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
  logger?: Logger
): Result[] => {
  const log = logger?.child("walkNodes") ?? new Logger("<hidden>::walkNodes");
  return [...element.childNodes].map((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      log.debug("element", element);
      const callback =
        callbacks[element.tagName.toLowerCase()] || callbacks.htmlFallback;
      log.debug("callback", callback);
      const result = callback(element, callbacks);
      log.debug("result", result);
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
