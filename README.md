# Eco-Metric | Interactive Engineering Storyboard

A minimalist, high-fidelity interactive web presentation and engineering blog built to transform static Canva storyboard slide decks into a fluid, multi-modal experience. Inspired by clean aesthetic principles and Canva-driven design workflows, this application delivers lightning-fast local rendering with zero build-step friction.

## Key Features

- **Fluid Slide Engine:** Smooth 1–9 slide navigation with letterbox-aware scaling and keyboard/touch support.
- **Contextual Audio Transitions:** Dynamic, low-latency `.m4a` audio triggers mapped to precise slide navigation pairs, concluding with a clean "landing on silence" design.
- **Interactive Reference Cards:** Normalised coordinate-mapped hotspots ($0.0$ to $1.0$) across slides 2, 4, and 7 featuring glassmorphic tooltips, direct institutional source attributions, and secure outbound citation links.
- **Minimalist Aesthetic:** Stripped of unnecessary clutter, focusing purely on high-resolution native JPEGs and crisp typography.

---

## Setup & Running Instructions

Because this project is built entirely on vanilla web standards without heavy build tools or bundlers, you can run it instantly:

1. **Clone or Download** the repository to your local machine.
2. **Open `index.html`** directly in any modern web browser (Google Chrome, Safari, Firefox, or Edge). 
   - *Tip:* For the best local development experience with asset loading (such as `.m4a` audio playback), you can serve the directory using a simple static file server:
     ```bash
     python3 -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser.

---

## Project Architecture

```text
eco-metric/
├── index.html       # Main application shell and markup structure
├── app.js           # Slide controller, audio mapping, and hotspot/reference logic
├── styles.css       # Minimalist styling, glassmorphism, and responsive layout
└── assets/
    ├── audio/       # Transition .m4a sound files
    └── *.jpg        # Native-resolution high-definition slide assets
