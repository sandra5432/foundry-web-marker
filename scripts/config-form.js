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
