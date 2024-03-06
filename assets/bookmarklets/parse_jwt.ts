import { copyToClipboard } from "./lib/lib";

const encoded = prompt("Paste encoded JWT:");
if (!encoded) throw new Error("No JWT provided");
const parts = encoded.split(".");
let [encodedHeader, encodedPayload, encodedSignature] = parts;
let [headerStr, payloadStr] = [encodedHeader, encodedPayload].map((part) =>
  atob(part)
);
let [header, payload] = [headerStr, payloadStr].map((str) => JSON.parse(str));
const prettyPrint = (json: any) => JSON.stringify(json, null, 2);

console.log({ header, payload, encodedSignature });

let popup = window.open("", "_blank");
popup.document.body.innerHTML = `<style>
pre{position:relative;width:fit-content; padding:1em;padding-right:2em;}
</style><h4>header</h4><pre><code>${prettyPrint(
  header
)}</code></pre><h4>payload</h4><pre><code>${prettyPrint(
  payload
)}</code></pre><h4>Encoded signature</h4><pre><code>${encodedSignature}</code></pre>`;

popup.document.body.querySelectorAll("pre").forEach((pre) => {
  pre.contentEditable = "true";
  pre.spellcheck = false;
  pre.autofocus = true;
  // IDEA: implement copy-on-click buttons
});
