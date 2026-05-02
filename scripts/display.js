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
