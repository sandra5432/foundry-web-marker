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

const DRAG_THRESHOLD = 6; // Pixel — unter diesem Wert gilt es als Klick

function screenToWorld(clientX, clientY) {
  const board = document.getElementById("board");
  const rect = board.getBoundingClientRect();
  return canvas.stage.toLocal(new PIXI.Point(clientX - rect.left, clientY - rect.top));
}

// Gespeicherte Listener-Referenzen damit sie bei erneutem canvasReady entfernt werden können
let _boardPointerHandler = null;
let _stageHoverHandler   = null;

export function initCanvasListeners() {
  const board = document.getElementById("board");
  let _hoveredTile = null;

  // Alte Listener entfernen falls canvasReady mehrfach feuert (Szenenwechsel)
  if (_boardPointerHandler) board?.removeEventListener("pointerdown", _boardPointerHandler, { capture: true });
  if (_stageHoverHandler)   canvas.stage.off("pointermove", _stageHoverHandler);

  // Hover
  _stageHoverHandler = (event) => {
    const pos = canvas.stage.toLocal(event.global);
    const tile = findWebMarkerAt(pos.x, pos.y);
    if (tile !== _hoveredTile) {
      if (_hoveredTile) removeHoverEffect(_hoveredTile);
      if (tile) applyHoverEffect(tile);
      _hoveredTile = tile;
    }
  };
  canvas.stage.on("pointermove", _stageHoverHandler);

  // Klick + Drag-Erkennung
  _boardPointerHandler = (e) => {
    if (e.button !== 0 && e.button !== 2) return;

    const downX = e.clientX;
    const downY = e.clientY;
    const pos   = screenToWorld(downX, downY);

    if (e.button === 0) {
      // Platzierungsmodus: sofort auslösen
      if (_placementActive) {
        _placementActive = false;
        board.style.cursor = "";
        openMarkerConfig({ position: pos });
        e.stopPropagation();
        return;
      }

      const tile = findWebMarkerAt(pos.x, pos.y);
      if (!tile) return;

      // Drag-Check: erst auf pointerup entscheiden
      e.stopPropagation();
      board.addEventListener("pointerup", function onUp(upEvent) {
        board.removeEventListener("pointerup", onUp, { capture: true });
        const dx = upEvent.clientX - downX;
        const dy = upEvent.clientY - downY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
          handleMarkerClick(tile.document.flags[MODULE_ID]);
        }
      }, { capture: true, once: true });

    } else if (e.button === 2) {
      const tile = findWebMarkerAt(pos.x, pos.y);
      if (tile) {
        showContextMenu(tile, e.clientX, e.clientY);
        e.stopPropagation();
      }
    }
  };

  board?.addEventListener("pointerdown", _boardPointerHandler, { capture: true });
}
