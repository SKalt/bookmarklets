document.title =
  prompt(
    "retitle tab to:",
    (document.querySelector("h1")?.textContent || document.title)
      .trim()
      .replace(/\s+/g, " ")
  ) ?? document.title;
