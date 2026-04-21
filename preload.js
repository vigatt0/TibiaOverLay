'use strict';

const { contextBridge } = require('electron');
const path = require('path');
const fs   = require('fs');
const { pathToFileURL } = require('url');

/**
 * Expose a minimal, safe API to the renderer process.
 * Only the overlay configuration is surfaced – no raw Node.js or Electron APIs.
 */
contextBridge.exposeInMainWorld('overlayAPI', {
  /**
   * Load and return the parsed overlays array from overlays.json.
   * Image paths are resolved to absolute file:// URLs so the renderer can
   * use them in <img> src attributes without any further Node.js access.
   *
   * @returns {Array<{src: string, x: number, y: number, width: number, height: number, opacity: number}>}
   */
  getOverlays() {
    const configPath = path.join(__dirname, 'overlays.json');
    let items;
    try {
      items = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      console.error('[TibiaOverLay] Failed to read overlays.json:', err.message);
      return [];
    }

    return items.map((item) => {
      // Sanitise the configured path to prevent directory traversal attacks.
      // Only accept simple relative paths (no `..` segments, no absolute paths).
      const rawPath = String(item.path || '');

      // Resolve the full absolute path and confirm it stays inside __dirname.
      // This prevents directory traversal regardless of `..` placement.
      const resolved = path.resolve(__dirname, rawPath);
      if (!resolved.startsWith(__dirname + path.sep)) {
        console.warn('[TibiaOverLay] Skipping unsafe image path:', rawPath);
        return null;
      }

      // Use pathToFileURL for reliable, cross-platform file:// URL construction
      return {
        src:     pathToFileURL(resolved).href,
        x:       Number(item.x)       || 0,
        y:       Number(item.y)       || 0,
        width:   Number(item.width)   || 0,
        height:  Number(item.height)  || 0,
        opacity: item.opacity != null ? Number(item.opacity) : 1,
      };
    }).filter(Boolean);
  },
});
