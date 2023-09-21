import {
  Callbacks,
  HtmlCallbacks,
  NodeCallbacks,
  stringToHtmlElement,
  textOf,
  walkNodes,
} from "./html";
import { Logger } from "./lib";

const h = (
  level: number,
  element: HTMLElement,
  cb: Callbacks<string>
): string => "\n\n" + "#".repeat(level) + " " + walkNodes(element, cb).join("");
const ignore = () => "";
const bold = <T>(el: HTMLElement, cb: Callbacks<T>): string =>
  `**${walkNodes(el, cb)}**`;
const italic = <T>(el: HTMLElement, cb: Callbacks<T>): string =>
  `_${walkNodes(el, cb)}_`;
const p = (el: HTMLElement, cb: Callbacks<string>): string =>
  "\n\n" +
  walkNodes(el, cb)
    .join("")
    .replaceAll(/^\s*[·|•|•|‣|◦|◦]\s*/g, "  - ");
export const defaultCallbacks = (): Callbacks<string> => ({
  a: (a, cb) => `[${walkNodes(a, cb).join("")}](${a.href})`,
  h1: (h1, cb) => h(1, h1, cb),
  h2: (h2, cb) => h(2, h2, cb),
  h3: (h3, cb) => h(3, h3, cb),
  h4: (h4, cb) => h(4, h4, cb),
  h5: (h5, cb) => h(5, h5, cb),
  h6: (h6, cb) => h(6, h6, cb),
  pre: (pre) => "\n```" + textOf(pre) + "```\n",
  code: (code) => "`" + textOf(code) + "`",
  blockquote: (blockquote, cb) =>
    "\n> " + walkNodes(blockquote, cb).join("").split("\n").join("\n> "),
  li: (li, cb) => walkNodes(li, cb).join("\n"),
  ol: (ol, cb) => `\n  1. ${walkNodes(ol, cb).join("\n  1. ")}\n`,
  ul: (ul, cb) => `\n  - ${walkNodes(ul, cb).join("\n  - ")}\n`,
  br: () => "\n\n",
  hr: () => `\n\n${"-".repeat(80)}\n\n`,
  img: (img) => `\n![${img.alt}](${img.src})\n`,
  strong: bold,
  b: bold,
  em: italic,
  i: italic,
  script: ignore,
  style: ignore,
  p,
  div: p,
  htmlFallback: (el: HTMLElement, cb) => walkNodes(el, cb).join(""),
  [Node.TEXT_NODE]: (node) => textOf(node),
  nodeFallback: ignore,
});
export const toMd = (
  html: string,
  callbacks: Callbacks<string> | null = null,
  logger: Logger | null = null
): string => {
  callbacks = { ...defaultCallbacks(), ...callbacks };
  const templateEl = stringToHtmlElement(html);
  if (logger) logger.child("to_md").log("templateEl", templateEl);
  return walkNodes(templateEl, callbacks)
    .join("")
    .trim()
    .replace(/\n{2,}/g, "\n\n");
};
