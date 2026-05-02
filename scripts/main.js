import { initSocket } from "./socket.js";
import { initCanvasListeners, setPlacementActive } from "./marker.js";

const TOOL_NAME = "place-web-marker";

function activatePlacement() {
  console.log("web-marker | activatePlacement aufgerufen");
  setPlacementActive(true);
  ui.notifications.info("Web Marker: Klicke auf die Karte um den Marker zu platzieren.");
}

Hooks.on("ready", () => {
  initSocket();
});

Hooks.on("canvasReady", () => {
  initCanvasListeners();
});

Hooks.on("getSceneControlButtons", (controls) => {
  console.log("web-marker | getSceneControlButtons, controls:", controls);
  const tileGroup = controls.tiles ?? controls.find?.(c => c.name === "tiles");
  if (!tileGroup) { console.warn("web-marker | tiles-Gruppe nicht gefunden"); return; }

  const toolDef = {
    name: TOOL_NAME,
    title: "Web Marker platzieren",
    icon: "fas fa-question-circle",
    onClick: activatePlacement,
    button: true
  };

  if (Array.isArray(tileGroup.tools)) {
    tileGroup.tools.push(toolDef);
  } else {
    (tileGroup.tools ??= {})[TOOL_NAME] = toolDef;
  }
});

// Direkter DOM-Listener als Fallback — funktioniert unabhängig von Foundrys interner onClick-Logik
Hooks.on("renderSceneControls", (app, html) => {
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;
  const btn = root.querySelector(`[data-tool="${TOOL_NAME}"]`);
  if (!btn) { console.log("web-marker | renderSceneControls: Button nicht gefunden"); return; }
  console.log("web-marker | renderSceneControls: Button gefunden, Listener gesetzt");
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePlacement();
  }, { capture: true });
});
