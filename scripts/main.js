import { initSocket } from "./socket.js";
import { initCanvasListeners, setPlacementActive } from "./marker.js";

Hooks.on("ready", () => {
  initSocket();
});

Hooks.on("canvasReady", () => {
  initCanvasListeners();
});

Hooks.on("getSceneControlButtons", (controls) => {
  // In Foundry v13 ist controls ein Objekt (keyed by name).
  // Falls es ein Array ist (ältere API), fällt der Code auf .find() zurück.
  const tileGroup = controls.tiles ?? controls.find?.(c => c.name === "tiles");
  if (!tileGroup) return;

  const tools = tileGroup.tools ?? (tileGroup.tools = {});
  tools["place-web-marker"] = {
    name: "place-web-marker",
    title: "Web Marker platzieren",
    icon: "fas fa-question-circle",
    onClick: () => {
      console.log("web-marker | onClick gefeuert");
      setPlacementActive(true);
      ui.notifications.info("Web Marker: Klicke auf die Karte um den Marker zu platzieren.");
    },
    button: true
  };
});
