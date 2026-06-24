# PALE HARVEST

A low-poly retro horror game that runs in your browser. Kansas, 1986 — three days
after your grandfather's funeral, you drive out to the farm he left you. His last
letter says to burn the scarecrow before the third sundown.

Tonight is the third night.

## How to play

**▶ Play it now in your browser: https://paxid.github.io/pale-harvest/**

Or run it locally — just double-click `index.html` (Chrome or Edge recommended).
You need an internet connection the first time — the page pulls the three.js
engine and two fonts from a CDN. Everything else (textures, sounds, the whole
world) is generated in code.

**Headphones recommended. Play in the dark.**

## Controls

| Key | Action |
|-----|--------|
| WASD / arrows | walk |
| Mouse | look |
| Shift | sprint — hold to run (no stamina limit) |
| E | interact / close notes |
| F | flashlight |
| Tab | journal (re-read anything you've found) |
| Esc | pause (releases the mouse) |

## What you're in for

- ~15–25 minutes for a full run
- A complete story told through the notes you find — read everything
- It is watching you. Static on the screen means it's close.
- If it catches you, you respawn at the last safe place. You don't lose your items.
- During the finale: **run and do not look back.**

## Tech (no spoilers)

- Plain JavaScript + three.js, no build step, no assets
- PS1-style rendering: ~480×270 internal resolution stretched with nearest-neighbor,
  vertex-snap wobble shader, heavy fog, CRT scanlines, film grain
- All audio is synthesized live with WebAudio (wind, drones, heartbeat, static,
  stingers, the scream)
- All textures are drawn onto canvases at boot (64px chunky pixels)
- The cornfield is one InstancedMesh (~4,000 stalks)
