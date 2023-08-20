const parse = (el: HTMLScriptElement) => {
  try {
    return JSON.parse(el.textContent || "null");
  } catch (e) {
    return null;
  }
};

{
  const elements = [
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ] as HTMLScriptElement[];
  let [first] = elements.map(parse).filter(Boolean);
  if (first) {
    prompt("date posted", first.datePosted ?? "");
  }
}
