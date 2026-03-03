<div align="center">

<img src="icons/icon128.png" width="96" alt="SkribblPro Logo" />

# SkribblPro

**An intelligent browser extension that helps you guess words faster on [skribbl.io](https://skribbl.io)**

![Manifest Version](https://img.shields.io/badge/Manifest-v3-blue?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.2-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-orange?style=flat-square)

</div>

---

## What is SkribblPro?

SkribblPro is a Chrome extension that injects a sleek overlay into [skribbl.io](https://skribbl.io) and uses smart word filtering, hint matching, and frequency-based scoring to surface the most likely answers in real time — so you can guess the word before anyone else.

---

## Features

### 🔍 Real-Time Guess Suggestions
As letters are revealed on the board, SkribblPro instantly narrows down a list of possible words and displays them as clickable buttons at the bottom of your screen. Click any suggestion to submit it as your guess immediately.

### 🤖 Auto Guess Mode
Toggle **Auto Guess** on and SkribblPro will automatically submit guesses from the suggestion list on a timer. You control the interval in Settings.

### ⚡ Auto-Submit When One Word Remains
When the hint narrows possibilities down to a single word, the extension submits it automatically — no click required.

### 🧠 Smart Filtering
SkribblPro uses three layers of intelligence to rank suggestions:
- **Word frequency** — words seen in previous rounds are ranked higher
- **Letter position frequency** — letters that commonly appear at each position in past answers are scored higher
- **Bigram frequency** — common letter pairs from past answers boost relevant words to the top

The **top 20% of high-confidence words** are highlighted in green so you can spot the best guesses at a glance.

### 💬 Chat-Aware Filtering
The extension reads the game chat to eliminate words other players have already guessed, and uses **Levenshtein distance** to intelligently handle "close!" messages — instantly narrowing results to words that are exactly one letter off from the close guess.

### 📝 Learns From Every Round
Every correct answer is saved locally. Over time, SkribblPro builds a personal word frequency database so suggestions become smarter the more you play.

### 📊 Stats Tracker
Track your **total rounds played** and **total guesses made** across all sessions, viewable from the Stats panel.

### ⚙️ Fully Configurable Settings
Open the Settings panel to customize:

| Setting | Description |
|---|---|
| **Auto Guess Timer** | How long (ms) between automatic guess submissions |
| **Alphabetical Sort** | Sort suggestions A–Z instead of by score |
| **Sort by Frequency** | Prioritize words seen most often in past games |
| **Confidence Threshold** | Only auto-guess when the word pool is ≤ N words |
| **Smart Filtering** | Toggle the AI-based scoring and pattern filtering on/off |

---

## Installation

SkribblPro is a **developer-mode extension** — it is not listed on the Chrome Web Store. Follow the steps below to install it.

### Step 1 — Get the files

**Option A: Clone the repository**
```bash
git clone https://github.com/Umbra-Domini/SkribblPro.git
```

**Option B: Download the ZIP**
1. Click the green **Code** button at the top of this page
2. Select **Download ZIP**
3. Extract the ZIP to a folder on your computer

---

### Step 2 — Open your browser's Extensions page

- **Chrome** → go to `chrome://extensions`
- **Edge** → go to `edge://extensions`
- **Brave** → go to `brave://extensions`
- **Opera** → go to `opera://extensions`

---

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer mode** ON.

> You should now see three new buttons appear: *Load unpacked*, *Pack extension*, and *Update*.

---

### Step 4 — Load the extension

1. Click **Load unpacked**
2. In the file picker, navigate to the folder you cloned or extracted in Step 1
3. Select the **root folder** (the one that contains `manifest.json`)
4. Click **Select Folder** (or **Open**)

The extension will appear in your list as **SkribblPro** with the green hat icon.

---

### Step 5 — Play

1. Go to [https://skribbl.io](https://skribbl.io) and join or create a game
2. The SkribblPro bar will automatically appear at the bottom of your screen
3. As the drawing progresses and letters are revealed, suggestions populate in real time
4. Click a suggestion to instantly submit it, or enable **Auto Guess** to let the extension play for you

---

## Folder Structure

```
SkribblPro/
├── manifest.json       # Extension configuration
├── content.js          # Core extension logic
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Save your word history, frequency data, stats, and settings locally |
| `host_permissions: skribbl.io` | Inject the overlay only on skribbl.io |

SkribblPro does **not** collect or transmit any data. Everything is stored locally in your browser.

---

## Author

Made by [UmbraDomini](https://github.com/Umbra-Domini)
