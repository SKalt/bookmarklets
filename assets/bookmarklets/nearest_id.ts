const getY = (el: Element | null | undefined): number =>
  el?.getBoundingClientRect().y ?? 0;
const getId = (el: Element | null | undefined): string =>
  el?.id || el?.getAttribute("name") || "";
const selected = getSelection()?.anchorNode?.parentElement;
if (!selected) throw "missing selection";
let goalY = getY(selected);
let elementsWithIds = [...document.querySelectorAll("[id],[name]")]
  .map((el): [string, number] => [getId(el), getY(el)])
  .filter(([_, y]) => y) // filter out elements having y=0 that can't be scrolled to
  .filter(([id, _]) => id) // id must be populated in order to scroll to it
  .sort(([, a], [, b]) => {
    // find the vertically closest element
    let x = Math.abs(goalY - a);
    let y = Math.abs(goalY - b);
    if (x > y) return 1;
    else if (y > x) return -1;
    else return 0;
  });
if (!elementsWithIds.length) throw "no elements with ids";
let [id] = elementsWithIds[0];
if (!id) throw "target missing id/name";
location.hash = "#" + id;
/*
Notes: I considered looping over `selected.previousElementSibling`, but that
would require looping over all parent's siblings too or risk missing nearby
id'd elements. Considering all id'd elements and choosing the closest one was
simplest.
*/
