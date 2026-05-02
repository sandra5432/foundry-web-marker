import { socketCreateTile, socketUpdateTile } from "./socket.js";

const MODULE_ID = "web-marker";
const DEFAULT_SIZE = 100;

export function openMarkerConfig({ tile = null, position = null } = {}) {
  console.log("web-marker | openMarkerConfig aufgerufen, pos:", position);

  const flags = tile?.document.flags[MODULE_ID] ?? {};
  const currentType = flags.type ?? "url";
  const currentContent = flags.content ?? "";

  const content = `
    <form style="padding:4px 0">
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
        <input type="url" id="wm-url" value="${currentType === "url" ? currentContent : ""}"
               placeholder="https://de.wikipedia.org/..." style="width:100%"/>
      </div>
      <div id="wm-text-field" class="form-group" style="${currentType !== "text"  ? "display:none" : ""}">
        <label>Text</label>
        <textarea id="wm-text" rows="5" style="width:100%">${currentType === "text" ? currentContent : ""}</textarea>
      </div>
      <div id="wm-image-field" class="form-group" style="${currentType !== "image" ? "display:none" : ""}">
        <label>Bildpfad</label>
        <input type="text" id="wm-image" value="${currentType === "image" ? currentContent : ""}"
               placeholder="worlds/meine-welt/assets/bild.jpg" style="width:100%"/>
      </div>
    </form>`;

  new Dialog({
    title: "Web Marker konfigurieren",
    content,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Speichern",
        callback: async (html) => {
          const root = html instanceof HTMLElement ? html : html[0];
          const type    = root.querySelector("#wm-type")?.value ?? "url";
          const content = root.querySelector(`#wm-${type}`)?.value ?? "";
          console.log("web-marker | speichern, type:", type, "content:", content);

          const tileData = {
            texture: { src: "modules/web-marker/assets/question-mark.svg" },
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
            flags: { [MODULE_ID]: { type, content } }
          };

          if (tile) {
            await socketUpdateTile(
              tile.document.uuid,
              { flags: { [MODULE_ID]: { type, content } } }
            );
          } else {
            await socketCreateTile({
              ...tileData,
              x: position.x - DEFAULT_SIZE / 2,
              y: position.y - DEFAULT_SIZE / 2
            });
          }
        }
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Abbrechen" }
    },
    default: "save",
    render: (html) => {
      const root = html instanceof HTMLElement ? html : html[0];
      const sel = root.querySelector("#wm-type");
      sel?.addEventListener("change", () => {
        ["url", "text", "image"].forEach(t => {
          const el = root.querySelector(`#wm-${t}-field`);
          if (el) el.style.display = t === sel.value ? "" : "none";
        });
      });
    }
  }, { width: 420 }).render(true);

  console.log("web-marker | Dialog.render(true) aufgerufen");
}
