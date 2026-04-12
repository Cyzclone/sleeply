export const CURSOR_STORAGE_KEY = "sleeply_cursor";
export const DEFAULT_CURSOR_ID = "lilac";

export const cursors = [
  { id: "lilac", name: "Lilac Arrow", file: "/cursors/lilac.svg", hotspot: "2 2" },
  { id: "classic", name: "Normal Cursor", file: "default" },
  { id: "retro", name: "Soft Arrow", file: "/cursors/retro-default.svg", hotspot: "2 2" },
  { id: "silver", name: "Silver Arrow", file: "/cursors/silver.svg", hotspot: "2 2" },
  { id: "midnight", name: "Midnight Arrow", file: "/cursors/midnight.svg", hotspot: "2 2" },
  { id: "pixel", name: "Pixel Arrow", file: "/cursors/pixel.svg", hotspot: "2 2" },
  { id: "bold", name: "Bold Arrow", file: "/cursors/bold.svg", hotspot: "3 3" },
];

export function getCursorById(cursorId) {
  return cursors.find((cursor) => cursor.id === cursorId) ?? cursors[0];
}
