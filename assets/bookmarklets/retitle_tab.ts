document.title =
  prompt(
    "retitle tab to:",
    document.querySelector("h1")?.textContent || document.title
  ) ?? document.title;
