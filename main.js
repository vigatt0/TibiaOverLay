'use strict';

const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// Must be called before the app 'ready' event fires to take effect
app.disableHardwareAcceleration();

// Polling interval in milliseconds for active-window detection
const FOCUS_POLL_INTERVAL_MS = 1000;

// Name of the game process to watch for (case-insensitive partial match)
const TIBIA_PROCESS_NAME = 'tibia';

let mainWindow = null;
let pollTimer = null;
let activeWin = null;

/**
 * Dynamically import active-win (ESM-only package) and store the reference.
 */
async function loadActiveWin() {
  try {
    const mod = await import('active-win');
    activeWin = mod.default ?? mod.activeWin ?? mod;
  } catch (err) {
    console.error('[TibiaOverLay] Could not load active-win:', err.message);
  }
}

/**
 * Create the main transparent overlay window.
 */
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  mainWindow = new BrowserWindow({
    // Cover the entire primary display
    x: 0,
    y: 0,
    width,
    height,

    // Transparent, frameless, no taskbar icon
    transparent: true,
    frame: false,
    skipTaskbar: true,

    // Always sit on top of the game
    alwaysOnTop: true,
    type: 'toolbar',   // hides from alt-tab on Linux/Windows

    // Start hidden – shown only when Tibia is in focus
    show: false,

    // Performance: no background throttling even when hidden
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      devTools: process.env.NODE_ENV === 'development',
    },
  });

  // Elevate above screen-saver / full-screen apps
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // Pass all mouse events straight through to the game
  mainWindow.setIgnoreMouseEvents(true);

  // Remove the default application menu to save memory
  mainWindow.setMenu(null);

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopFocusPolling();
  });
}

/**
 * Check whether the currently active window belongs to the Tibia process.
 * Shows or hides the overlay accordingly.
 */
async function checkTibiaFocus() {
  if (!mainWindow || !activeWin) return;

  try {
    const result = await activeWin();
    const isTibiaFocused =
      result &&
      result.owner &&
      result.owner.name &&
      result.owner.name.toLowerCase().includes(TIBIA_PROCESS_NAME);

    if (isTibiaFocused) {
      if (!mainWindow.isVisible()) {
        mainWindow.showInactive(); // show without stealing focus
      }
    } else {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      }
    }
  } catch (err) {
    // active-win may throw on permission errors (e.g. macOS without screen recording)
    console.warn('[TibiaOverLay] active-win error:', err.message);
  }
}

/**
 * Start the focus-polling loop.
 */
function startFocusPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(checkTibiaFocus, FOCUS_POLL_INTERVAL_MS);
}

/**
 * Stop the focus-polling loop.
 */
function stopFocusPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.on('ready', async () => {
  await loadActiveWin();
  createWindow();
  startFocusPolling();
});

app.on('window-all-closed', () => {
  stopFocusPolling();
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
    startFocusPolling();
  }
});
