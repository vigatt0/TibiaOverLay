# TibiaOverLay

A lightweight, transparent game overlay for [Tibia](https://www.tibia.com/), built with [Electron](https://www.electronjs.org/) and Node.js. It renders configurable image overlays (maps, HUD elements, custom graphics) directly on top of the game window – with zero impact on game inputs.

---

## Features

| Feature | Details |
|---|---|
| **Ultra-light window** | Transparent, frameless, no taskbar icon, always on top at `screen-saver` level |
| **Click-through** | All mouse events pass directly to the game (`setIgnoreMouseEvents`) |
| **Hardware acceleration disabled** | Reduces GPU memory usage |
| **Dynamic focus detection** | Overlay appears only when Tibia is the active window (polling via `active-win`) |
| **JSON-driven overlays** | Add, move, resize and reorder overlays by editing a single JSON file |

---

## Requirements

- [Node.js](https://nodejs.org/) 18 or later  
- [npm](https://www.npmjs.com/) 9 or later

---

## Installation

```bash
# Clone the repository
git clone https://github.com/vigatt0/TibiaOverLay.git
cd TibiaOverLay

# Install dependencies
npm install
```

---

## Running

```bash
npm start
```

The overlay window will appear **only when the Tibia client is the active (focused) window**.

---

## Configuration (`overlays.json`)

Edit `overlays.json` to manage the images shown on screen. Each entry supports:

| Field | Type | Description |
|---|---|---|
| `path` | `string` | Relative path to the image file (from the project root) |
| `x` | `number` | Left position in pixels |
| `y` | `number` | Top position in pixels |
| `width` | `number` | Width in pixels |
| `height` | `number` | Height in pixels |
| `opacity` | `number` | Opacity `0.0` (invisible) – `1.0` (fully opaque) |

### Example

```json
[
  {
    "path": "assets/minimap.png",
    "x": 10,
    "y": 10,
    "width": 300,
    "height": 300,
    "opacity": 0.9
  },
  {
    "path": "assets/hud.png",
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080,
    "opacity": 0.75
  }
]
```

---

## Project Structure

```
TibiaOverLay/
├── main.js          # Electron main process – window creation, focus polling
├── preload.js       # Context bridge – exposes overlay config to renderer safely
├── index.html       # Renderer – reads overlays.json and positions images
├── style.css        # Full-screen transparent container styles
├── overlays.json    # Overlay configuration (edit to customise)
├── assets/
│   └── sample-overlay.png   # Sample test image (200×200 crosshair)
└── package.json
```

---

## Building a distributable

```bash
# Windows
npm run build:win

# Linux
npm run build:linux

# macOS
npm run build:mac
```

Built packages are output to the `dist/` directory.

---

## Notes

- **macOS**: `active-win` requires the *Screen Recording* permission to read the active window name. Grant it in *System Settings → Privacy & Security → Screen Recording*.
- **Linux**: The overlay uses `type: 'toolbar'` to avoid appearing in alt-tab. Some compositors may handle this differently.
- The overlay does **not** inject any code into the game process and is fully compliant with client-side overlay policies.
