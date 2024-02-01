import {
  Callback,
  Callbacks,
  HtmlCallbacks,
  State,
  stringToHtmlElement,
  textOf,
  walkNodes,
  newline,
} from "./html";
import { Logger } from "./lib";

const h =
  (level: number): Callback<HTMLElement, string> =>
  (el, state, cbs, logger) =>
    newline(state) +
    newline(state) +
    "#".repeat(level) +
    " " +
    walkNodes(el, state, cbs, logger).join("");
const ignore = () => "";

const bold: Callback<HTMLElement, string> = (el, state, cbs, logger): string =>
  `**${walkNodes(el, state, cbs, logger).join("")}**`;
const italic: Callback<HTMLElement, string> = (
  el,
  state,
  cbs,
  logger
): string => `_${walkNodes(el, state, cbs, logger)}_`;

const blockElement: Callback<HTMLElement, string> = (
  el,
  state,
  cbs,
  logger
): string => {
  const children = walkNodes(el, state, cbs, logger);
  logger?.debug("children", children);
  return (
    newline(state) +
    newline(state) + // TODO: differentiate single/double newlines?
    children.join("").replaceAll(/^\s*[·|•|•|‣|◦|◦]\s*/g, "- ")
  );
};

const pre = (pre: HTMLPreElement): string => "\n```" + textOf(pre) + "```\n";

const fallback: Callback<HTMLElement, string> = (el, state, cbs, logger) =>
  walkNodes(el, state, cbs, logger).join("");
const preserve: Callback<HTMLElement, string> = (el, state, cbs, logger) =>
  el.outerHTML; // TODO: handle indentation?;
// const _blockElements = ["DL", "DD", "DT", "FIELDSET"];

const list =
  (prefix: string): Callback<HTMLUListElement | HTMLOListElement, string> =>
  (list, state, cbs, logger) => {
    return (
      newline(state) +
      walkNodes(list, { indent: state.indent + "  ", prefix }, cbs, logger)
        .map((l) => l.trimEnd())
        .filter((childText) => Boolean(childText.trim()))
        .join("") +
      newline(state)
    );
  };

const blockElements = {
  pre,
  p: blockElement,
  div: blockElement,
  header: blockElement,
  footer: blockElement,
  hgroup: blockElement,
  article: blockElement,
  main: blockElement,
  section: blockElement,
  address: blockElement, // TODO: omit from job descriptions?

  // web-application-specific block elements that don't have a meaningful analog
  // in markdown
  form: ignore,
  fieldset: ignore,
  output: ignore,
  menu: ignore,
  nav: ignore,
  noscript: ignore,
  canvas: ignore,
  iframe: (el: HTMLIFrameElement) => {
    console.warn("iframe detected:", el);
    return ignore();
  },
  html: fallback,
  body: fallback,

  h1: h(1),
  h2: h(2),
  h3: h(3),
  h4: h(4),
  h5: h(5),
  h6: h(6),

  hr: (_: HTMLHRElement, state: State, cbs: Callbacks<string>) =>
    newline(state) +
    newline(state) +
    "-".repeat(80) +
    newline(state) +
    newline(state),

  aside: preserve,
  figure: preserve, // also covers figcaption
  audio: preserve, // I never expect to see this one
  table: preserve, // TODO: handle tables
  video: preserve,

  blockquote: (
    el: HTMLQuoteElement,
    state: State,
    cbs: Callbacks<string>,
    logger?: Logger
  ): string => {
    return (
      newline(state) +
      newline(state) +
      walkNodes(
        el,
        { ...state, indent: state.indent + "> " },
        cbs,
        logger
      ).join("") +
      newline(state)
    );
  },

  /** should be overridden by indentBlocks  */
  li: (
    li: HTMLLIElement,
    state: State,
    cbs: Callbacks<string>,
    logger?: Logger
  ) => {
    const innerState = { ...state, indent: state.indent + "  " };
    let inner = fallback(li, innerState, cbs, logger);
    {
      // remove all leading indented lines
      const innerLine = newline(innerState);
      while (inner.startsWith(innerLine)) inner = inner.slice(innerLine.length);
    }
    return newline(state) + state.prefix + inner;
  },

  ol: list("1. "),
  ul: list("- "),
};

export const defaultCallbacks: Callbacks<string> = {
  ...(blockElements as Partial<Callbacks<string>>),
  a: (a, state, _, logger) =>
    `[${walkNodes(a, state, defaultCallbacks, logger).join("")}](${a.href})`,
  code: (code) => "`" + textOf(code) + "`",

  br: (_: HTMLBRElement, state: State, _callbacks, logger) =>
    newline(state) + newline(state),

  picture: preserve,
  img: (img, _state, _callbacks, logger) => ` ![${img.alt}](${img.src}) `,

  strong: bold,
  b: bold,

  em: italic,
  i: italic,

  script: ignore,
  style: ignore,

  htmlFallback: fallback,
  [Node.TEXT_NODE]: (node) => textOf(node),
  nodeFallback: ignore,
};

export const toMd = (
  html: HTMLElement | string,
  callbacks: Callbacks<string> | null = null,
  logger: Logger | null = null
): string => {
  const log = logger?.child("to_md");
  callbacks = { ...defaultCallbacks, ...callbacks };
  const state = { indent: "", prefix: "- " };
  const rootEl =
    typeof html === "string" ? stringToHtmlElement(html) : html.parentElement;
  log?.info("templateEl", rootEl);
  return walkNodes(rootEl, state, callbacks, log)
    .join("")
    .trim()
    .replace(/\n{2,}/g, "\n\n");
};
