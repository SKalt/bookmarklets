/**
 * Select the clicked HTML element
 * @returns The clicked HTML element
 */
const selectElement = async (): Promise<HTMLElement | null> =>
  new Promise((resolve, reject) => {
    const handle = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      return event.target as HTMLElement;
    };
    const cancelSearch = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cleanUp();
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
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", cancelSearch);
      document.removeEventListener("mouseover", onMouseOver);
    };
    document.addEventListener("mouseover", onMouseOver);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", cancelSearch);
  });

const cloneHtml = (element: HTMLElement): HTMLTemplateElement => {
  const tpl = document.createElement("template");
  tpl.innerHTML = element.outerHTML;
  return tpl;
};
const textOf = (node: Node): string => node.textContent?.trim() || "";
const h = (n: number, el: HTMLElement) => "#".repeat(n) + " " + walkNodes(el);
const walkNodes = (
  element: HTMLElement,
  indentLevel = 0,
  prefix = "  "
): string => {
  return [...element.childNodes]
    .map((node): string => {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          // handle the element
          const element = node as HTMLElement;
          switch (element.tagName) {
            case "H1":
              return h(1, element);
            case "H2":
              return h(2, element);
            case "H3":
              return h(3, element);
            case "H4":
              return h(4, element);
            case "H5":
              return h(5, element);
            case "H6":
              return h(6, element);
            case "UL":
              return `\n${walkNodes(element, indentLevel + 1, "- ")}`;
            case "OL":
              return `\n${walkNodes(element, indentLevel + 1, "1. ")}`;
            case "LI":
              return (
                "  ".repeat(indentLevel) +
                (prefix || "- ") +
                walkNodes(element, indentLevel + 1) +
                "\n"
              );
            case "PRE": {
              return "\n```" + textOf(element) + "\n```\n";
            }
            case "BLOCKQUOTE": {
              const _prefix = prefix + "> ";
              return (
                _prefix + walkNodes(element, indentLevel + 1, _prefix) + "\n"
              );
            }
            case "BR":
              return "\n\n";
            case "HR":
              return `\n\n${"-".repeat(80)}\n\n`;
            case "A": {
              const href = (element as HTMLAnchorElement).href;
              if (href) return `[${walkNodes(element)}](${href})`;
              else return walkNodes(element);
            }
            case "SCRIPT":
            case "STYLE":
              return "";
            case "DIV":
            case "P":
              // TODO: transform line-delimited "- "
              return "\n\n" + walkNodes(element, indentLevel + 1) + "\n\n";
            case "CODE":
              return "`" + textOf(element) + "`";
            case "IMG": {
              const img = element as HTMLImageElement;
              return `![${img.alt}](${img.src})`;
            }
            case "STRONG":
            case "B":
              return `**${walkNodes(element)}**`;
            case "EM":
            case "I":
              return `_${walkNodes(element)}_`;
            default:
              return walkNodes(element, indentLevel, prefix);
          }
        case Node.TEXT_NODE:
          return textOf(node);
        default:
          console.log("ignoring node type: ", node.nodeType, node);
          return "";
      }
    })
    .join("");
};

(async () => {
  const element = await selectElement();
  if (!element) throw new Error("No element selected");
  const tpl = cloneHtml(element);
  const md = walkNodes(tpl.content.firstElementChild as HTMLElement);
  console.log(md.trim().replace(/\n\n\n+/g, "\n\n"));
  try {
    await window.navigator.clipboard.writeText(md);
  } catch (e) {
    console.error(e);
  }
})();
