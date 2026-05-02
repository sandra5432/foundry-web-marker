import { handleMarkerClick } from "./display.js";
import { openMarkerConfig } from "./config-form.js";
import { socketDeleteTile } from "./socket.js";

const MODULE_ID = "web-marker";

// --- Treffererkennung ---

export function findWebMarkerAt(x, y) {
  if (!canvas?.tiles?.placeables) return null;
  for (const tile of canvas.tiles.placeables) {
    if (!tile.document.flags[MODULE_ID]) continue;
    const { x: tx, y: ty, width, height } = tile.document;
    if (x >= tx && x <= tx + width && y >= ty && y <= ty + height) {
      return tile;
    }
  }
  return null;
}

// --- Hover-Effekt ---

function applyHoverEffect(tile) {
  if (!tile?.mesh) return;
  tile.mesh.tint = 0xf0c040;
}

function removeHoverEffect(tile) {
  if (!tile?.mesh) return;
  tile.mesh.tint = 0xffffff;
}

// --- Kontextmenü ---

let _activeMenu = null;

function removeContextMenu() {
  _activeMenu?.remove();
  _activeMenu = null;
}

function showContextMenu(tile, screenX, screenY) {
  removeContextMenu();
  const menu = document.createElement("div");
  menu.className = "web-marker-context-menu";
  menu.style.left = `${screenX}px`;
  menu.style.top = `${screenY}px`;
  menu.innerHTML = `
    <button data-action="edit"><i class="fas fa-edit"></i> Bearbeiten</button>
    <button data-action="delete"><i class="fas fa-trash"></i> Löschen</button>
  `;
  menu.querySelector("[data-action=edit]").addEventListener("click", () => {
    removeContextMenu();
    openMarkerConfig({ tile });
  });
  menu.querySelector("[data-action=delete]").addEventListener("click", async () => {
    removeContextMenu();
    await socketDeleteTile(tile.document.uuid);
  });
  document.body.appendChild(menu);
  _activeMenu = menu;
  setTimeout(() => document.addEventListener("click", removeContextMenu, { once: true }), 0);
}

// --- Platzierungsmodus ---

let _placementActive = false;

export function setPlacementActive(active) {
  console.log("web-marker | setPlacementActive:", active);
  _placementActive = active;
  const board = document.getElementById("board");
  if (board) board.style.cursor = active ? "crosshair" : "";
}

// --- Canvas-Listener ---

function screenToWorld(clientX, clientY) {
  const board = document.getElementById("board");
  const rect = board.getBoundingClientRect();
  return canvas.stage.toLocal(new PIXI.Point(clientX - rect.left, clientY - rect.top));
}

export function initCanvasListeners() {
  let _hoveredTile = null;

  // Hover: PIXI stage (kein Propagation-Problem bei pointermove)
  canvas.stage.on("pointermove", (event) => {
    const pos = canvas.stage.toLocal(event.global);
    const tile = findWebMarkerAt(pos.x, pos.y);
    if (tile !== _hoveredTile) {
      if (_hoveredTile) removeHoverEffect(_hoveredTile);
      if (tile) applyHoverEffect(tile);
      _hoveredTile = tile;
    }
  });

  // Klick: DOM capture-Phase, feuert vor Foundrys TilesLayer
  const board = document.getElementById("board");
  board?.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    const pos = screenToWorld(e.clientX, e.clientY);

    if (e.button === 0) {
      console.log("web-marker | board pointerdown, placementActive:", _placementActive, "pos:", pos);

      if (_placementActive) {
        _placementActive = false;
        board.style.cursor = "";
        openMarkerConfig({ position: pos });
        e.stopPropagation();
        return;
      }

      const tile = findWebMarkerAt(pos.x, pos.y);
      if (tile) {
        console.log("web-marker | tile gefunden, öffne Inhalt");
        handleMarkerClick(tile.document.flags[MODULE_ID]);
        e.stopPropagation();
      }

    } else if (e.button === 2) {
      const tile = findWebMarkerAt(pos.x, pos.y);
      if (tile) {
        showContextMenu(tile, e.clientX, e.clientY);
        e.stopPropagation();
      }
    }
  }, { capture: true });
}
