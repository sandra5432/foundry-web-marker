# Web Marker — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foundry VTT v13 Modul das interaktive "?" Tile-Marker auf Maps platziert; Klick öffnet URL im Browser oder Text/Bild als Foundry-Popup.

**Architecture:** Marker sind Foundry Tiles mit `flags["web-marker"]` Daten. Ein PIXI stage-level Pointer-Listener übernimmt Klicks für alle User (inkl. Spieler ohne Tile-Rechte). Tile-Mutationen durch Spieler werden via GM-Socket-Proxy ausgeführt.

**Tech Stack:** Foundry VTT v13, PIXI.js v8 (in Foundry gebündelt), ES Modules, Handlebars (in Foundry gebündelt), Foundry ApplicationV2

---

## Datei-Map

| Datei | Verantwortlichkeit |
|-------|--------------------|
| `module.json` | Modul-Manifest, Einstiegspunkte |
| `assets/question-mark.svg` | Marker Icon |
| `templates/config-form.hbs` | Handlebars Template für Config-Dialog |
| `scripts/display.js` | URL öffnen, Text-Dialog, Bild-Popout |
| `scripts/config-form.js` | `WebMarkerConfig` ApplicationV2 Formular |
| `scripts/socket.js` | GM-Socket-Proxy für Tile-Operationen |
| `scripts/marker.js` | Treffererkennung, Hover, Canvas-Listener |
| `scripts/main.js` | Einstiegspunkt, Hook-Registrierung |
| `styles/module.css` | Kontextmenü und Dialog CSS |

---

## Task 1: Modul-Scaffold

**Dateien:**
- Erstellen: `module.json`
- Erstellen: `scripts/main.js` (Stub)

- [ ] **Schritt 1: `module.json` erstellen**

```json
{
  "id": "web-marker",
  "title": "Web Marker",
  "description": "Interaktive ? Marker auf Maps mit URL, Text oder Bildinhalt.",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "13",
    "verified": "13"
  },
  "authors": [{ "name": "Sandra" }],
  "esmodules": ["scripts/main.js"],
  "styles": ["styles/module.css"],
  "templates": ["templates/config-form.hbs"]
}
```

- [ ] **Schritt 2: `scripts/main.js` (Stub) erstellen**

```js
console.log("web-marker | geladen");
```

- [ ] **Schritt 3: In Foundry testen**

Foundry → Einstellungen → Module verwalten → "Web Marker" aktivieren → Bestätigen.
Browser-Konsole: `web-marker | geladen` muss erscheinen.

- [ ] **Schritt 4: Commit**

```bash
git add module.json scripts/main.js
git commit -m "feat: add module scaffold"
```

---

## Task 2: SVG Asset

**Dateien:**
- Erstellen: `assets/question-mark.svg`

- [ ] **Schritt 1: `assets/question-mark.svg` erstellen**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="rgba(0,0,0,0.5)"/>
  <text
    x="50" y="70"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="62"
    font-weight="bold"
    fill="#f0c040"
  >?</text>
</svg>
```

- [ ] **Schritt 2: Im Browser prüfen**

Datei `assets/question-mark.svg` direkt im Browser öffnen.
Erwartet: goldenes "?" auf halbtransparentem dunklem Kreis.

- [ ] **Schritt 3: Commit**

```bash
git add assets/question-mark.svg
git commit -m "feat: add question mark SVG asset"
```

---

## Task 3: Handlebars Template

**Dateien:**
- Erstellen: `templates/config-form.hbs`

- [ ] **Schritt 1: `templates/config-form.hbs` erstellen**

Jeder Inhaltstyp hat einen eigenen benannten Input (`url-content`, `text-content`, `image-content`),
damit beim Submit klar ist, welcher Wert zu welchem Typ gehört.

```hbs
<form>
  <div class="form-group">
    <label>Inhaltstyp</label>
    <select name="type" class="wm-type-select">
      <option value="url"   {{#if (eq type "url")  }}selected{{/if}}>URL</option>
      <option value="text"  {{#if (eq type "text") }}selected{{/if}}>Text</option>
      <option value="image" {{#if (eq type "image")}}selected{{/if}}>Bild</option>
    </select>
  </div>

  <div class="form-group wm-field" data-type="url">
    <label>URL</label>
    <input type="url" name="url-content" value="{{urlContent}}"
           placeholder="https://de.wikipedia.org/..."/>
  </div>

  <div class="form-group wm-field" data-type="text" style="display:none">
    <label>Text</label>
    <textarea name="text-content" rows="6">{{textContent}}</textarea>
  </div>

  <div class="form-group wm-field" data-type="image" style="display:none">
    <label>Bild</label>
    <div class="form-fields">
      <input type="text" name="image-content" value="{{imageContent}}"
             placeholder="modules/web-marker/assets/bild.jpg"/>
      <button type="button" class="file-picker"
              data-type="imagevideo"
              data-target="input[name='image-content']"
              title="Datei auswählen">
        <i class="fas fa-file-import"></i>
      </button>
    </div>
  </div>

  <footer class="form-footer flexrow">
    <button type="submit" class="bright">
      <i class="fas fa-save"></i> Speichern
    </button>
  </footer>
</form>
```

- [ ] **Schritt 2: Commit**

```bash
git add templates/config-form.hbs
git commit -m "feat: add config form Handlebars template"
```

---

## Task 4: CSS Styling

**Dateien:**
- Erstellen: `styles/module.css`

- [ ] **Schritt 1: `styles/module.css` erstellen**

```css
/* Kontextmenü */
.web-marker-context-menu {
  position: fixed;
  z-index: 10000;
  background: #1a1a2e;
  border: 1px solid #f0c040;
  border-radius: 4px;
  padding: 4px 0;
  min-width: 140px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.web-marker-context-menu button {
  display: block;
  width: 100%;
  padding: 6px 14px;
  background: none;
  border: none;
  color: #e8e8e8;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.web-marker-context-menu button:hover {
  background: rgba(240, 192, 64, 0.2);
  color: #f0c040;
}

/* Config Form */
.web-marker-config .window-content {
  padding: 12px;
}

.web-marker-config .form-group {
  margin-bottom: 10px;
}

.web-marker-config textarea {
  resize: vertical;
  min-height: 80px;
  width: 100%;
}
```

- [ ] **Schritt 2: Commit**

```bash
git add styles/module.css
git commit -m "feat: add CSS styling"
```

---

## Task 5: Display-Logik

**Dateien:**
- Erstellen: `scripts/display.js`

- [ ] **Schritt 1: `scripts/display.js` erstellen**

```js
export function openUrl(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function showTextPopup(text) {
  new Dialog({
    title: "Information",
    content: `<p style="white-space:pre-wrap; padding:8px;">${text}</p>`,
    buttons: { close: { label: "Schließen" } },
    default: "close"
  }).render(true);
}

export function showImagePopout(src) {
  new ImagePopout(src, {
    title: "Bild",
    shareable: false
  }).render(true);
}

export function handleMarkerClick(flags) {
  const { type, content } = flags;
  if (type === "url")   return openUrl(content);
  if (type === "text")  return showTextPopup(content);
  if (type === "image") return showImagePopout(content);
}
```

- [ ] **Schritt 2: In Foundry-Konsole testen (nach Task 9)**

```js
// Im Foundry Browser-Konsole ausführen:
const { openUrl, showTextPopup, showImagePopout } =
  await import("/modules/web-marker/scripts/display.js");

openUrl("https://www.google.de");               // erwartet: neuer Tab
showTextPopup("Hallo Welt\nZeile 2");            // erwartet: Dialog
showImagePopout("icons/svg/mystery-man.svg");   // erwartet: Bild-Popout
```

- [ ] **Schritt 3: Commit**

```bash
git add scripts/display.js
git commit -m "feat: add display logic"
```

---

## Task 6: Socket Handler

**Dateien:**
- Erstellen: `scripts/socket.js`

Spieler können Tiles nicht direkt erstellen/bearbeiten/löschen — der GM-Client übernimmt
diese Operationen über einen Socket-Proxy.

- [ ] **Schritt 1: `scripts/socket.js` erstellen**

```js
const SOCKET = "module.web-marker";
const MODULE_ID = "web-marker";

export function initSocket() {
  game.socket.on(SOCKET, async (request) => {
    if (!game.user.isGM) return;
    const scene = game.scenes.current;
    if (!scene) return;

    if (request.action === "createTile") {
      await TileDocument.create(request.data, { parent: scene });

    } else if (request.action === "updateTile") {
      const tile = await fromUuid(request.uuid);
      await tile?.update(request.data);

    } else if (request.action === "deleteTile") {
      const tile = await fromUuid(request.uuid);
      await tile?.delete();
    }
  });
}

export async function socketCreateTile(data) {
  if (game.user.isGM) {
    await TileDocument.create(data, { parent: canvas.scene });
  } else {
    game.socket.emit(SOCKET, { action: "createTile", data });
  }
}

export async function socketUpdateTile(uuid, updateData) {
  if (game.user.isGM) {
    const tile = await fromUuid(uuid);
    await tile?.update(updateData);
  } else {
    game.socket.emit(SOCKET, { action: "updateTile", uuid, data: updateData });
  }
}

export async function socketDeleteTile(uuid) {
  if (game.user.isGM) {
    const tile = await fromUuid(uuid);
    await tile?.delete();
  } else {
    game.socket.emit(SOCKET, { action: "deleteTile", uuid });
  }
}
```

- [ ] **Schritt 2: Commit**

```bash
git add scripts/socket.js
git commit -m "feat: add GM socket proxy for tile operations"
```

---

## Task 7: Config-Formular Klasse

**Dateien:**
- Erstellen: `scripts/config-form.js`

- [ ] **Schritt 1: `scripts/config-form.js` erstellen**

```js
import { socketCreateTile, socketUpdateTile } from "./socket.js";

const MODULE_ID = "web-marker";
const TEMPLATE = "modules/web-marker/templates/config-form.hbs";
const DEFAULT_SIZE = 100;

export class WebMarkerConfig extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  constructor(options = {}) {
    super(options);
    this._tile = options.tile ?? null;
    this._position = options.position ?? { x: 0, y: 0 };
  }

  static DEFAULT_OPTIONS = {
    id: "web-marker-config",
    classes: ["web-marker-config"],
    tag: "form",
    form: {
      handler: WebMarkerConfig._onSubmit,
      closeOnSubmit: true
    },
    window: { title: "Web Marker konfigurieren" },
    position: { width: 420 }
  };

  static PARTS = {
    form: { template: TEMPLATE }
  };

  async _prepareContext() {
    const flags = this._tile?.document.flags[MODULE_ID] ?? {};
    const type = flags.type ?? "url";
    const content = flags.content ?? "";
    return {
      type,
      urlContent:   type === "url"   ? content : "",
      textContent:  type === "text"  ? content : "",
      imageContent: type === "image" ? content : ""
    };
  }

  _onRender(context, options) {
    const typeSelect = this.element.querySelector(".wm-type-select");
    typeSelect?.addEventListener("change", () => this._syncTypeFields());
    this._syncTypeFields();
  }

  _syncTypeFields() {
    const type = this.element.querySelector(".wm-type-select")?.value;
    this.element.querySelectorAll(".wm-field").forEach(el => {
      el.style.display = el.dataset.type === type ? "" : "none";
    });
  }

  static async _onSubmit(event, form, formData) {
    const data = formData.object;
    const type = data.type;
    const content = data[`${type}-content`] ?? "";

    const tileData = {
      texture: { src: "modules/web-marker/assets/question-mark.svg" },
      width: DEFAULT_SIZE,
      height: DEFAULT_SIZE,
      flags: { [MODULE_ID]: { type, content } }
    };

    if (this._tile) {
      await socketUpdateTile(
        this._tile.document.uuid,
        { flags: { [MODULE_ID]: { type, content } } }
      );
    } else {
      await socketCreateTile({
        ...tileData,
        x: this._position.x - DEFAULT_SIZE / 2,
        y: this._position.y - DEFAULT_SIZE / 2
      });
    }
  }
}

export function openMarkerConfig({ tile = null, position = null } = {}) {
  new WebMarkerConfig({ tile, position }).render(true);
}
```

- [ ] **Schritt 2: Commit**

```bash
git add scripts/config-form.js
git commit -m "feat: add WebMarkerConfig ApplicationV2 form"
```

---

## Task 8: Marker-Operationen & Canvas-Listener

**Dateien:**
- Erstellen: `scripts/marker.js`

- [ ] **Schritt 1: `scripts/marker.js` erstellen**

```js
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
  _placementActive = active;
}

// --- Canvas-Listener ---

export function initCanvasListeners() {
  let _hoveredTile = null;

  canvas.stage.on("pointermove", (event) => {
    const pos = event.getLocalPosition(canvas.stage);
    const tile = findWebMarkerAt(pos.x, pos.y);
    if (tile !== _hoveredTile) {
      if (_hoveredTile) removeHoverEffect(_hoveredTile);
      if (tile) applyHoverEffect(tile);
      _hoveredTile = tile;
    }
  });

  canvas.stage.on("pointerdown", (event) => {
    if (event.button === 0) {
      const pos = event.getLocalPosition(canvas.stage);

      if (_placementActive) {
        _placementActive = false;
        openMarkerConfig({ position: pos });
        return;
      }

      const tile = findWebMarkerAt(pos.x, pos.y);
      if (tile) {
        handleMarkerClick(tile.document.flags[MODULE_ID]);
        event.stopPropagation();
      }

    } else if (event.button === 2) {
      const pos = event.getLocalPosition(canvas.stage);
      const tile = findWebMarkerAt(pos.x, pos.y);
      if (tile) {
        showContextMenu(tile, event.clientX, event.clientY);
        event.stopPropagation();
      }
    }
  });
}
```

- [ ] **Schritt 2: Commit**

```bash
git add scripts/marker.js
git commit -m "feat: add marker hit detection, hover effect, canvas listeners"
```

---

## Task 9: Main Entry Point & Toolbar

**Dateien:**
- Ersetzen: `scripts/main.js`

- [ ] **Schritt 1: `scripts/main.js` vollständig ersetzen**

```js
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
    onChange: (active) => setPlacementActive(active),
    button: true
  };
});
```

> **Hinweis:** Falls der "?" Button nicht erscheint — in der Konsole prüfen:
> ```js
> Hooks.once("getSceneControlButtons", (c) => console.log(c));
> ```
> Dann Seite neu laden und die Struktur von `c` inspizieren, um den Tile-Eintrag zu finden.

- [ ] **Schritt 2: Commit**

```bash
git add scripts/main.js
git commit -m "feat: wire up hooks and toolbar button"
```

---

## Task 10: End-to-End Tests in Foundry

- [ ] **Test 1: URL Marker (als GM)**
  1. Tile-Controls öffnen → "?" Button klicken → auf Map klicken
  2. Formular: Typ "URL", Inhalt `https://de.wikipedia.org` → Speichern
  3. Tile mit "?" erscheint auf der Map
  4. Klick auf Tile → neuer Browser-Tab mit Wikipedia öffnet sich

- [ ] **Test 2: Text Marker (als GM)**
  1. Neuen Marker platzieren → Typ "Text" → Text eingeben → Speichern
  2. Klick → Foundry-Dialog zeigt den Text

- [ ] **Test 3: Bild Marker (als GM)**
  1. Neuen Marker platzieren → Typ "Bild" → Datei-Picker nutzen → Speichern
  2. Klick → ImagePopout zeigt das Bild

- [ ] **Test 4: Hover-Effekt**
  - Maus über Marker bewegen → Tile wird gold
  - Maus wegbewegen → Tile kehrt zu normalem Aussehen zurück

- [ ] **Test 5: Bearbeiten**
  - Rechtsklick auf Marker → "Bearbeiten" → Formular öffnet sich mit bestehenden Werten vorausgefüllt
  - Inhalt ändern → Speichern → Klick zeigt neuen Inhalt

- [ ] **Test 6: Löschen**
  - Rechtsklick auf Marker → "Löschen" → Tile verschwindet von der Map

- [ ] **Test 7: Spieler-Test**
  - Zweiten Browser-Tab öffnen → als Spieler einloggen
  - "?" Button im Toolbar sichtbar?
  - Spieler platziert Marker → Tile erscheint für alle (via GM Socket)
  - Spieler klickt Marker → Inhalt wird angezeigt
  - Spieler rechtsklickt Marker → Bearbeiten/Löschen funktioniert

- [ ] **Test 8: Final Commit**

```bash
git add -A
git commit -m "feat: web-marker module v1.0.0 complete"
```
