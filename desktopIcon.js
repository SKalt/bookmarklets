// max 65536 ch / 32KB
let title = document.title;
let desktopIcon=new Blob([`[Desktop Entry]
Comment=${title}
Terminal=false
Name=${title}
Exec=xdg-open ${location.host}
Type=Application
Icon=applications-internet
NoDisplay=false`], {type: 'text/plain'});
let [link,div] = ['a','div'].map(c=>document.createElement(c))
link.download = `${title.replace(/[^\w]/g, '_')}.desktop`
link.href = URL.createObjectURL(desktopIcon)
link.textContent = `download ${link.download}`
div.style = "position: absolute; top: 0; border: 1px solid black;"
div.appendChild(link)
div.onclick = () => document.body.removeChild(div)
document.body.appendChild(div)
