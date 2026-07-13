import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distServer = path.join(root, "dist", "server");

const fontFiles = [
  ["400", "m-plus-rounded-1c-400.woff2"],
  ["500", "m-plus-rounded-1c-500.woff2"],
  ["700", "m-plus-rounded-1c-700.woff2"],
  ["800", "m-plus-rounded-1c-800.woff2"],
  ["900", "m-plus-rounded-1c-900.woff2"],
];

const [html, css, app, ...fonts] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
  ...fontFiles.map(([, fileName]) => readFile(path.join(root, "assets", "fonts", fileName))),
]);

const fontEntries = fontFiles
  .map(([, fileName], index) =>
    `  "/assets/fonts/${fileName}": { body: decodeBase64(${JSON.stringify(fonts[index].toString("base64"))}), type: "font/woff2" },`
  )
  .join("\n");

const worker = `function decodeBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

const files = {
  "/": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/index.html": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/styles.css": { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" },
  "/app.js": { body: ${JSON.stringify(app)}, type: "text/javascript; charset=utf-8" },
${fontEntries}
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const file = files[url.pathname];

    if (!file) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new Response(file.body, {
      headers: {
        "content-type": file.type,
        "cache-control": "public, max-age=60",
      },
    });
  },
};
`;

await mkdir(distServer, { recursive: true });
await writeFile(path.join(distServer, "index.js"), worker);
