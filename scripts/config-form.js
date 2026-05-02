import { socketCreateTile, socketUpdateTile } from "./socket.js";

const MODULE_ID = "web-marker";
const DEFAULT_SIZE = 100;

function buildFormHTML(currentType, currentContent) {
  const esc = (s) => String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `
    <form style="padding:8px 4px">
      <div class="form-group">
        <label>Inhaltstyp</label>
        <select id="wm-type">
          <option value="url"   ${currentType === "url"   ? "selected" : ""}>URL</option>
          <option value="text"  ${currentType === "text"  ? "selected" : ""}>Text</option>
          <option value="image" ${currentType === "image" ? "selected" : ""}>Bild</option>
        </select>
      </div>

      <div id="wm-url-field" class="form-group" style="${currentType !== "url"   ? "display:none" : ""}">
        <label>URL</label>
        <input type="url" id="wm-url"
               value="${currentType === "url" ? esc(currentContent) : ""}"
               placeholder="https://de.wikipedia.org/..."
               style="width:100%"/>
      </div>

      <div id="wm-text-field" class="form-group" style="${currentType !== "text"  ? "display:none" : ""}">
        <label>Text</label>
        <textarea id="wm-text" rows="4" style="width:100%">${currentType === "text" ? esc(currentContent) : ""}</textarea>
      </div>

      <div id="wm-image-field" class="form-group" style="${currentType !== "image" ? "display:none" : ""}">
        <label>Bildpfad</label>
        <input type="text" id="wm-image"
               value="${currentType === "image" ? esc(currentContent) : ""}"
               placeholder="worlds/meine-welt/assets/bild.jpg"
               style="width:100%"/>
      </div>

      <div class="flexrow" style="margin-top:12px;gap:6px">
        <button type="button" data-action="wm-save" class="bright">
          <i class="fas fa-save"></i> Speichern
        </button>
        <button type="button" data-action="wm-cancel">
          <i class="fas fa-times"></i> Abbrechen
        </button>
      </div>
    </form>`;
}

class WebMarkerConfig extends foundry.applications.api.ApplicationV2 {

  constructor(options = {}) {
    super(options);
    this._tile     = options.tile     ?? null;
    this._position = options.position ?? { x: 0, y: 0 };
  }

  static DEFAULT_OPTIONS = {
    id: "web-marker-config",
    classes: ["web-marker-config"],
    window: { title: "Web Marker konfigurieren" },
    position: { width: 420, height: "auto" }
  };

  async _prepareContext() {
    const flags = this._tile?.document.flags[MODULE_ID] ?? {};
    return {
      type:    flags.type    ?? "url",
      content: flags.content ?? ""
    };
  }

  async _renderHTML(context, options) {
    return buildFormHTML(context.type, context.content);
  }

  _replaceHTML(result, content, options) {
    content.innerHTML = result;
    this._activateListeners(content);
  }

  _activateListeners(html) {
    const sel = html.querySelector("#wm-type");
    sel?.addEventListener("change", () => {
      ["url", "text", "image"].forEach(t => {
        const el = html.querySelector(`#wm-${t}-field`);
        if (el) el.style.display = t === sel.value ? "" : "none";
      });
    });

    html.querySelector("[data-action=wm-save]")?.addEventListener("click", async () => {
      const type    = html.querySelector("#wm-type")?.value ?? "url";
      const content = html.querySelector(`#wm-${type}`)?.value ?? "";
      console.log("web-marker | speichern, type:", type, "content:", content);

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
      this.close();
    });

    html.querySelector("[data-action=wm-cancel]")?.addEventListener("click", () => this.close());
  }
}

export function openMarkerConfig({ tile = null, position = null } = {}) {
  console.log("web-marker | openMarkerConfig aufgerufen, pos:", position);
  new WebMarkerConfig({ tile, position }).render(true);
}
