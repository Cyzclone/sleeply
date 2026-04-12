export function setCursor(cursor) {
  const root = document.documentElement;
  const body = document.body;

  if (!body || !root) {
    return;
  }

  const file = typeof cursor === "string" ? cursor : cursor?.file;
  const hotspot =
    typeof cursor === "object" && cursor?.hotspot ? ` ${cursor.hotspot}` : " 3 3";

  if (!file || file === "default") {
    root.style.setProperty("--sl-app-cursor", "default");
    body.style.cursor = "default";
    return;
  }

  const cursorValue = `url('${file}')${hotspot}, default`;

  root.style.setProperty("--sl-app-cursor", cursorValue);
  body.style.cursor = cursorValue;
}
