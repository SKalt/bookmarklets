let title = document.title,
  blob = new Blob(
    [
      `[Desktop Entry]\nComment=${title}\nTerminal=false\nName=${title}\nExec=xdg-open ${location.host}\nType=Application\nIcon=applications-internet\nNoDisplay=false`,
    ],
    { type: "text/plain" } // can this mime type be omitted?
  ),
  [a, div] = ["a", "div"].map((l) => document.createElement(l)) as [
    HTMLAnchorElement,
    HTMLDivElement
  ];
a.download = `${title.replace(/[^\w]/g, "_")}.desktop`;
a.href = URL.createObjectURL(blob);
a.textContent = `download ${a.download}`;
Object.assign(div.style, {
  position: "absolute",
  top: "0",
  border: "1px solid black",
});
div.appendChild(a);
div.onclick = () => document.body.removeChild(div);
document.body.appendChild(div);
