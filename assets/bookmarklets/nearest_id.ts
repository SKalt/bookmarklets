let id = getSelection()?.anchorNode?.parentElement?.closest("[id]")?.id;
if (id) location.hash = "#" + id;
