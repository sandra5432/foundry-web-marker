# Web Marker — Foundry VTT Modul Design

**Datum:** 2026-05-02
**Foundry VTT Version:** v13
**Modul-ID:** `web-marker`

---

## Überblick

Ein Foundry VTT Modul, das interaktive "?" Marker auf Maps ermöglicht. Jeder Marker ist mit einem Inhalt verknüpft (URL, Text oder Bild). Ein Klick auf den Marker öffnet den Inhalt — entweder als neuen Browser-Tab (URL) oder als Foundry-Popup (Text/Bild).

**Zielgruppe:** Alle Nutzer (GM + Spieler) haben vollen Zugriff.

---

## Berechtigungen

| Aktion | GM | Spieler |
|--------|:---:|:-------:|
| Marker platzieren | ✓ | ✓ |
| Marker bearbeiten | ✓ | ✓ |
| Marker löschen | ✓ | ✓ |
| Marker ansehen & klicken | ✓ | ✓ |

Keine Eigentümerprüfung — alle Marker sind für alle bearbeitbar.

---

## Dateistruktur

```
foundry/
├── module.json
├── scripts/
│   ├── main.js          # Einstiegspunkt, Hook-Registrierung
│   ├── marker.js        # Tile-Erstellung + Click-Handler
│   ├── config-form.js   # Konfigformular (Typ + Inhalt)
│   └── display.js       # Popup-Anzeige (Text, Bild, URL)
├── styles/
│   └── module.css       # Marker-Styling & Dialog-Styling
└── assets/
    └── question-mark.svg
```

---

## Architektur

### Ansatz: Tile-basierte Marker

Marker werden als Foundry Tiles auf dem Tile-Layer erstellt. Inhalte werden als Tile-Flags gespeichert. Da Spieler Tiles normalerweise nicht anklicken können, wird ein PIXI-Stage-Level-Listener registriert, der bei jedem Canvas-Klick prüft ob ein `web-marker`-Tile an dieser Position liegt.

### Datenfluss

1. Nutzer aktiviert das Web-Marker-Tool in der Tile-Toolbar
2. Klick auf Canvas öffnet `config-form.js`: Typ (URL/Text/Bild) + Inhalt eingeben
3. Tile wird mit `?`-Grafik erstellt, Inhalt in `tile.flags["web-marker"]` gespeichert
4. Jeder Canvas-Klick wird geprüft: liegt ein `web-marker`-Tile an dieser Position?
   - Ja → passende Aktion ausführen
   - Nein → normales Canvas-Verhalten

### Tile-Flags Datenmodell

```json
{
  "flags": {
    "web-marker": {
      "type": "url" | "text" | "image",
      "content": "<url> | <text> | <dateipfad>"
    }
  }
}
```

---

## Konfigformular (`config-form.js`)

- Öffnet sich beim Platzieren eines neuen Markers
- Öffnet sich beim Doppelklick auf einen bestehenden Marker (vorausgefüllt)
- Felder:
  - **Typ-Dropdown:** URL / Text / Bild
  - **URL:** Textfeld (`https://...`)
  - **Text:** Mehrzeiliges Textarea
  - **Bild:** Foundry `FilePicker` + Vorschau
- Implementiert als Foundry v13 `ApplicationV2` (nicht das veraltete `FormApplication`)

---

## Visuelle Darstellung

- **Icon:** SVG "?" in goldgelb (`#f0c040`) auf dunklem Halbkreis-Hintergrund — RPG-Stil
- **Größe:** Standard 1 Tile-Einheit, frei skalierbar
- **Hover-Effekt:** Leichtes Pulsieren oder Aufleuchten via PIXI `pointerover`/`pointerout` Events + Alpha-Tween
- **Glüh-Effekt:** PIXI `GlowFilter` (dauerhaft schwach, stärker bei Hover)

---

## Popup-Verhalten

| Typ | Verhalten |
|-----|-----------|
| URL | `window.open(url, '_blank')` — öffnet neuen Browser-Tab |
| Text | Foundry `Dialog` mit dem eingegebenen Text, schließbar per X |
| Bild | Foundry `ImagePopout` — zoombar, schwarz unterlegt |

---

## Technische Besonderheiten

### Spieler-Klick auf Tiles

Spieler haben keinen Zugriff auf den Tiles-Layer-Interaktionen. Lösung: PIXI-Stage-Listener auf `canvas.app.stage` registrieren (Hook: `canvasReady`). Bei jedem Klick werden alle Tiles mit `web-marker`-Flag auf Überschneidung mit der Klickposition geprüft (PIXI `getBounds()`).

### Tile-Operationen ohne GM-Rechte

Tile-Erstellung und -Bearbeitung durch Spieler erfolgt via `CONFIG.Tile.documentClass.create()` mit `{temporary: false}` — Foundry v13 erlaubt dies über Socket-basierte Dokument-Operationen, sofern die Szene nicht gesperrt ist.

---

## Nicht im Scope

- Mehrere Inhalte pro Marker
- Marker-Kategorien oder Farben
- Import/Export von Marker-Daten
- Zugriffssteuerung per Spieler-Rolle
