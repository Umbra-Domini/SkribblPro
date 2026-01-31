// Author - UmbraDomini - https://github.com/Umbra-Domini/SkribblPro
(function () {
"use strict";

const autoGuessLastWord = true;

// ---------------------------
// Chrome Storage Helpers
// ---------------------------

let correctAnswers = [];
let wordFrequency = {}; // Track how often each word appears
let stats = {
    totalRounds: 0,
    totalGuesses: 0
};
let settings = {
    autoGuessTimer: 3500,
    alphabeticalSort: false,
    sortByFrequency: false,
    confidenceThreshold: 0 // 0 means disabled, 1-10 means only auto-guess when <= X words remain
};

function loadCorrectAnswers() {
    chrome.storage.local.get(["correctAnswers"], (result) => {
        correctAnswers = result.correctAnswers || [];
    });
}

function saveCorrectAnswers() {
    chrome.storage.local.set({ correctAnswers });
}

function loadWordFrequency() {
    chrome.storage.local.get(["wordFrequency"], (result) => {
        wordFrequency = result.wordFrequency || {};
    });
}

function saveWordFrequency() {
    chrome.storage.local.set({ wordFrequency });
}

function loadStats() {
    chrome.storage.local.get(["stats"], (result) => {
        if (result.stats) {
            stats = { ...stats, ...result.stats };
            updateStatsDisplay();
        }
    });
}

function saveStats() {
    chrome.storage.local.set({ stats });
    updateStatsDisplay();
}

function incrementWordFrequency(word) {
    word = word.toLowerCase();
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    saveWordFrequency();
}

function loadSettings() {
    chrome.storage.local.get(["settings"], (result) => {
        if (result.settings) {
            settings = { ...settings, ...result.settings };
            updateSettingsUI();
        }
    });
}

function saveSettings() {
    chrome.storage.local.set({ settings });
}

loadCorrectAnswers();
loadWordFrequency();
loadStats();
loadSettings();

// ---------------------------
// UI Creation
// ---------------------------

function createUI() {
    document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div id="bottom-ui">
            <div id="settings-shelf" class="section">
                <button id="remaining-guesses" class="ui-btn">Possible Guesses: 0</button>
                <button id="auto-guess" class="ui-btn">Auto Guess: OFF</button>
                <button id="stats-btn" class="ui-btn">Stats</button>
                <button id="settings-btn" class="ui-btn">Settings</button>
            </div>
            <div id="guess-shelf" class="section"></div>

            <style>
                    #bottom-ui {
                    position: fixed;
                    bottom: 0;
                    width: 100%;
                    background: linear-gradient(
                        135deg,
                        rgba(9, 0, 0, 0.6),
                        rgba(3, 0, 0, 0.85)
                    );
                    backdrop-filter: blur(30px) saturate(180%);
                    border-top-left-radius: 24px;
                    border-top-right-radius: 24px;
                    box-shadow:
                        0 -12px 30px rgba(0, 0, 0, 0.4),
                        inset 0 1px 0 rgba(245, 245, 245, 0.1);
                    flex-direction: column;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    transition: transform 0.15s cubic-bezier(0.4,0,1,1);
                    color: var(--text);
                }

                .hidden {
                    transform: translateY(100%);
                }

                .section {
                    display: flex;
                    gap: 12px;
                    padding: 14px 24px;
                    overflow-x: auto;
                }

                .ui-btn {
                    flex: 0 0 auto;
                    font-size: 15px;
                    font-weight: 500;
                    padding: 10px 18px;
                    border: 1px solid rgba(0, 255, 200, 0.25);
                    border-radius: 14px;
                    background: linear-gradient(
                        135deg,
                        rgba(0, 255, 200, 0.15),
                        rgba(0, 255, 200, 0.08)
                    );
                    color: #0ad290ff;
                    cursor: pointer;
                    box-shadow: 0 0 12px rgba(0, 255, 200, 0.25);
                    transition: background 0.3s, transform 0.2s;
                }

                .ui-btn:hover {
                    background: rgba(0, 255, 200, 0.25);
                }

                .ui-btn:active {
                    transform: scale(0.97);
                }

                /* Settings Modal */
                #settings-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }

                #settings-modal.show {
                    display: flex;
                }

                .settings-content {
                    background: linear-gradient(
                        135deg,
                        rgba(20, 20, 20, 0.95),
                        rgba(10, 10, 10, 0.98)
                    );
                    border: 1px solid rgba(0, 255, 200, 0.3);
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }

                .settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .settings-header h2 {
                    color: #0ad290ff;
                    font-size: 24px;
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #0ad290ff;
                    font-size: 28px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: background 0.2s;
                }

                .close-btn:hover {
                    background: rgba(0, 255, 200, 0.1);
                }

                .setting-item {
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid rgba(0, 255, 200, 0.1);
                }

                .setting-item:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }

                .setting-label {
                    color: #0ad290ff;
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .info-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(0, 255, 200, 0.5);
                    color: rgba(0, 255, 200, 0.7);
                    font-size: 12px;
                    font-weight: bold;
                    cursor: help;
                    position: relative;
                    transition: all 0.2s;
                }

                .info-icon:hover {
                    border-color: #0ad290ff;
                    color: #0ad290ff;
                    background: rgba(0, 255, 200, 0.1);
                }

                .tooltip {
                    position: absolute;
                    bottom: calc(100% + 8px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(10, 210, 144, 0.95);
                    color: #000;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border: 6px solid transparent;
                    border-top-color: rgba(10, 210, 144, 0.95);
                }

                .info-icon:hover .tooltip {
                    opacity: 1;
                }

                .setting-description {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 13px;
                    margin-bottom: 12px;
                    display: none;
                }

                .setting-input {
                    background: rgba(0, 255, 200, 0.05);
                    border: 1px solid rgba(0, 255, 200, 0.25);
                    border-radius: 10px;
                    color: #0ad290ff;
                    font-size: 15px;
                    padding: 10px 14px;
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .setting-input:focus {
                    outline: none;
                    border-color: rgba(0, 255, 200, 0.5);
                    box-shadow: 0 0 12px rgba(0, 255, 200, 0.2);
                }

                .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .toggle-switch {
                    position: relative;
                    width: 52px;
                    height: 28px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: background 0.3s;
                    border: 1px solid rgba(0, 255, 200, 0.2);
                }

                .toggle-switch.active {
                    background: rgba(0, 255, 200, 0.3);
                    border-color: rgba(0, 255, 200, 0.5);
                }

                .toggle-slider {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 22px;
                    height: 22px;
                    background: #0ad290ff;
                    border-radius: 50%;
                    transition: transform 0.3s;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .toggle-switch.active .toggle-slider {
                    transform: translateX(24px);
                }

                .toggle-label {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                }

                .save-btn {
                    width: 100%;
                    margin-top: 24px;
                    padding: 14px;
                    background: linear-gradient(
                        135deg,
                        rgba(0, 255, 200, 0.2),
                        rgba(0, 255, 200, 0.15)
                    );
                    border: 1px solid rgba(0, 255, 200, 0.4);
                    border-radius: 12px;
                    color: #0ad290ff;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .save-btn:hover {
                    background: rgba(0, 255, 200, 0.3);
                    box-shadow: 0 0 20px rgba(0, 255, 200, 0.3);
                }

                /* Stats Modal */
                #stats-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }

                #stats-modal.show {
                    display: flex;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    background: rgba(0, 255, 200, 0.08);
                    border: 1px solid rgba(0, 255, 200, 0.25);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    transition: all 0.3s;
                }

                .stat-card:hover {
                    background: rgba(0, 255, 200, 0.15);
                    border-color: rgba(0, 255, 200, 0.4);
                    transform: translateY(-2px);
                }

                .stat-card.highlight {
                    background: linear-gradient(
                        135deg,
                        rgba(0, 255, 200, 0.15),
                        rgba(0, 255, 200, 0.1)
                    );
                    border-color: rgba(0, 255, 200, 0.5);
                }

                .stat-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #0ad290ff;
                    margin-bottom: 8px;
                }

                .stat-label {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                }

            </style>
        </div>

        <!-- Settings Modal -->
        <div id="settings-modal">
            <div class="settings-content">
                <div class="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button class="close-btn" id="close-settings">×</button>
                </div>

                <div class="setting-item">
                    <label class="setting-label">
                        Auto Guess Timer (ms)
                        <span class="info-icon">
                            i
                            <span class="tooltip">Delay between automatic guesses (1000ms = 1 second)</span>
                        </span>
                    </label>
                    <input type="number" id="timer-input" class="setting-input" min="1000" max="10000" step="100" value="3500">
                </div>

                <div class="setting-item">
                    <label class="setting-label">
                        Alphabetical Sorting
                        <span class="info-icon">
                            i
                            <span class="tooltip">Sort word suggestions A-Z</span>
                        </span>
                    </label>
                    <div class="toggle-container">
                        <div class="toggle-switch" id="alphabetical-toggle">
                            <div class="toggle-slider"></div>
                        </div>
                        <span class="toggle-label" id="alphabetical-label">OFF</span>
                    </div>
                </div>

                <div class="setting-item">
                    <label class="setting-label">
                        Sort by Popularity
                        <span class="info-icon">
                            i
                            <span class="tooltip">Show most common words first (learns over time)</span>
                        </span>
                    </label>
                    <div class="toggle-container">
                        <div class="toggle-switch" id="frequency-toggle">
                            <div class="toggle-slider"></div>
                        </div>
                        <span class="toggle-label" id="frequency-label">OFF</span>
                    </div>
                </div>

                <div class="setting-item">
                    <label class="setting-label">
                        Auto-Guess Confidence Threshold
                        <span class="info-icon">
                            i
                            <span class="tooltip">Wait until ≤ X words remain before auto-guessing (0 = disabled)</span>
                        </span>
                    </label>
                    <input type="number" id="confidence-input" class="setting-input" min="0" max="20" step="1" value="0" placeholder="0 = Always guess">
                </div>

                <button class="save-btn" id="save-settings">Save Settings</button>
            </div>
        </div>

        <!-- Stats Modal -->
        <div id="stats-modal">
            <div class="settings-content">
                <div class="settings-header">
                    <h2>Statistics</h2>
                    <button class="close-btn" id="close-stats">×</button>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="stat-rounds">0</div>
                        <div class="stat-label">Total Rounds</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-total-guesses">0</div>
                        <div class="stat-label">Total Guesses</div>
                    </div>
                    <div class="stat-card highlight">
                        <div class="stat-value" id="stat-avg-guesses">0</div>
                        <div class="stat-label">Avg Guesses/Round</div>
                    </div>
                    <div class="stat-card highlight">
                        <div class="stat-value" id="stat-words">0</div>
                        <div class="stat-label">Words Learned</div>
                    </div>
                </div>

                <button class="save-btn" id="reset-stats">Reset All Stats</button>
            </div>
        </div>
    `
    );

    const ui = document.getElementById("bottom-ui");
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") ui.classList.add("hidden");
        if (e.key === "ArrowUp") ui.classList.remove("hidden");
    });

    setupSettingsModal();
    setupStatsModal();
}

createUI();

// ---------------------------
// Settings Modal Logic
// ---------------------------

function setupSettingsModal() {
    const modal = document.getElementById("settings-modal");
    const settingsBtn = document.getElementById("settings-btn");
    const closeBtn = document.getElementById("close-settings");
    const saveBtn = document.getElementById("save-settings");
    const timerInput = document.getElementById("timer-input");
    const alphabeticalToggle = document.getElementById("alphabetical-toggle");
    const alphabeticalLabel = document.getElementById("alphabetical-label");
    const frequencyToggle = document.getElementById("frequency-toggle");
    const frequencyLabel = document.getElementById("frequency-label");
    const confidenceInput = document.getElementById("confidence-input");

    // Open modal
    settingsBtn.addEventListener("click", () => {
        modal.classList.add("show");
        updateSettingsUI();
    });

    // Close modal
    closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });

    // Toggle alphabetical sort
    alphabeticalToggle.addEventListener("click", () => {
        const isActive = alphabeticalToggle.classList.toggle("active");
        alphabeticalLabel.textContent = isActive ? "ON" : "OFF";
        
        // Disable frequency sort if alphabetical is enabled
        if (isActive && frequencyToggle.classList.contains("active")) {
            frequencyToggle.classList.remove("active");
            frequencyLabel.textContent = "OFF";
        }
    });

    // Toggle frequency sort
    frequencyToggle.addEventListener("click", () => {
        const isActive = frequencyToggle.classList.toggle("active");
        frequencyLabel.textContent = isActive ? "ON" : "OFF";
        
        // Disable alphabetical sort if frequency is enabled
        if (isActive && alphabeticalToggle.classList.contains("active")) {
            alphabeticalToggle.classList.remove("active");
            alphabeticalLabel.textContent = "OFF";
        }
    });

    // Save settings
    saveBtn.addEventListener("click", () => {
        settings.autoGuessTimer = parseInt(timerInput.value) || 3500;
        settings.alphabeticalSort = alphabeticalToggle.classList.contains("active");
        settings.sortByFrequency = frequencyToggle.classList.contains("active");
        settings.confidenceThreshold = parseInt(confidenceInput.value) || 0;
        
        saveSettings();
        
        // Restart auto-guessing if it's active
        if (autoGuessing) {
            clearInterval(autoGuessInterval);
            startAutoGuessing();
        }

        // Re-render guesses with new sort order
        generateGuesses();
        
        modal.classList.remove("show");
    });
}

function updateSettingsUI() {
    const timerInput = document.getElementById("timer-input");
    const alphabeticalToggle = document.getElementById("alphabetical-toggle");
    const alphabeticalLabel = document.getElementById("alphabetical-label");
    const frequencyToggle = document.getElementById("frequency-toggle");
    const frequencyLabel = document.getElementById("frequency-label");
    const confidenceInput = document.getElementById("confidence-input");

    if (timerInput) timerInput.value = settings.autoGuessTimer;
    if (confidenceInput) confidenceInput.value = settings.confidenceThreshold;
    
    if (alphabeticalToggle) {
        if (settings.alphabeticalSort) {
            alphabeticalToggle.classList.add("active");
            alphabeticalLabel.textContent = "ON";
        } else {
            alphabeticalToggle.classList.remove("active");
            alphabeticalLabel.textContent = "OFF";
        }
    }

    if (frequencyToggle) {
        if (settings.sortByFrequency) {
            frequencyToggle.classList.add("active");
            frequencyLabel.textContent = "ON";
        } else {
            frequencyToggle.classList.remove("active");
            frequencyLabel.textContent = "OFF";
        }
    }
}

// ---------------------------
// Stats Modal Logic
// ---------------------------

function setupStatsModal() {
    const modal = document.getElementById("stats-modal");
    const statsBtn = document.getElementById("stats-btn");
    const closeBtn = document.getElementById("close-stats");
    const resetBtn = document.getElementById("reset-stats");

    // Open modal
    statsBtn.addEventListener("click", () => {
        modal.classList.add("show");
        updateStatsDisplay();
    });

    // Close modal
    closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });

    // Reset stats
    resetBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all statistics? This cannot be undone.")) {
            stats = {
                totalRounds: 0,
                totalGuesses: 0
            };
            saveStats();
        }
    });
}

function updateStatsDisplay() {
    const elements = {
        rounds: document.getElementById("stat-rounds"),
        totalGuesses: document.getElementById("stat-total-guesses"),
        avgGuesses: document.getElementById("stat-avg-guesses"),
        words: document.getElementById("stat-words")
    };

    if (!elements.rounds) return; // UI not loaded yet

    elements.rounds.textContent = stats.totalRounds;
    elements.totalGuesses.textContent = stats.totalGuesses;
    
    // Calculate average guesses per round
    const avg = stats.totalRounds > 0 
        ? (stats.totalGuesses / stats.totalRounds).toFixed(1)
        : "0";
    elements.avgGuesses.textContent = avg;
    
    // Show words learned
    elements.words.textContent = correctAnswers.length;

    // Stats button always shows just "📊 Stats"
    const statsBtn = document.getElementById("stats-btn");
    if (statsBtn) {
        statsBtn.textContent = `Stats`;
    }
}

// ---------------------------
// Wordlist Fetching
// ---------------------------

async function fetchWords(url) {
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();
    return text.split("\n").filter((w) => w.trim() !== "");
}

async function fetchAndStoreLatestWordlist() {
    const words = await fetchWords(
        "https://raw.githubusercontent.com/Umbra-Domini/SkribblPro/refs/heads/main/skribblWordlist.txt"
    );

    const set = new Set(correctAnswers);
    words.forEach((w) => {
        if (!set.has(w)) correctAnswers.push(w);
    });

    saveCorrectAnswers();
}

fetchAndStoreLatestWordlist();

// ---------------------------
// Username Detection
// ---------------------------

let myUsername = "";

function findUsername() {
    const target = document.querySelector(".players-list");
    if (!target) return;

    const observer = new MutationObserver(() => {
        const me = document.querySelector(".me");
        if (me) {
            myUsername = me.textContent.replace(" (You)", "");
            observer.disconnect();
        }
    });

    observer.observe(target, { childList: true });
}

findUsername();

// ---------------------------
// Word Reveal Observer
// ---------------------------

function observeDrawingTurn() {
    const target = document.querySelector(".words");
    if (!target) return;

    const observer = new MutationObserver(() => {
        target.childNodes.forEach((node) => {
            const text = node.textContent.toLowerCase();
            if (!correctAnswers.includes(text)) {
                correctAnswers.push(text);
                saveCorrectAnswers();
            }
            // Track frequency even if word already exists
            incrementWordFrequency(text);
        });
    });

    observer.observe(target, { childList: true });
}

observeDrawingTurn();

// ---------------------------
// Guess UI
// ---------------------------

const remainingButton = document.getElementById("remaining-guesses");
const guessShelf = document.getElementById("guess-shelf");
const input = document.querySelector('#game-chat input[data-translate="placeholder"]');

let possibleWords = [];

function renderGuesses(words) {
    guessShelf.innerHTML = "";
    remainingButton.textContent = `Remaining Guesses: ${possibleWords.length}`;

    // Apply sorting if enabled
    let sortedWords = [...words];
    
    if (settings.sortByFrequency) {
        // Sort by frequency (most common first), then alphabetically as tiebreaker
        sortedWords.sort((a, b) => {
            const freqA = wordFrequency[a] || 0;
            const freqB = wordFrequency[b] || 0;
            if (freqB !== freqA) {
                return freqB - freqA; // Higher frequency first
            }
            return a.localeCompare(b); // Alphabetical tiebreaker
        });
    } else if (settings.alphabeticalSort) {
        sortedWords.sort((a, b) => a.localeCompare(b));
    }

    sortedWords.forEach((word) => {
        const btn = document.createElement("button");
        btn.className = "ui-btn";
        btn.textContent = word;
        btn.onclick = () => {
            input.value = word;
            input.closest("form").dispatchEvent(new Event("submit", { bubbles: true }));
        };
        guessShelf.appendChild(btn);
    });
}

function generateGuesses() {
    if (possibleWords.length === 1 && autoGuessLastWord) {
        input.value = possibleWords.shift();
        input.closest("form").dispatchEvent(new Event("submit", { bubbles: true }));
    }

    const pattern = input.value.toLowerCase().trim();
    const filtered = possibleWords.filter((w) => w.startsWith(pattern));
    renderGuesses(filtered);
}

input.addEventListener("input", generateGuesses);

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        input.value = guessShelf.firstElementChild?.innerText ?? input.value;
        input.closest("form").dispatchEvent(new Event("submit", { bubbles: true }));
    }
});

// ---------------------------
// Hint Filtering
// ---------------------------

function storeAnswer(word) {
    word = word.toLowerCase();

    const i = correctAnswers.indexOf(word);
    if (i < 0) {
        correctAnswers.push(word);
    } else {
        const j = i === 0 ? 0 : i - 1;
        [correctAnswers[i], correctAnswers[j]] = [correctAnswers[j], correctAnswers[i]];
    }

    // Increment frequency tracking for this word
    incrementWordFrequency(word);

    saveCorrectAnswers();
    return [];
}

function filterHints(words) {
    const hints = Array.from(document.querySelectorAll(".hints .hint"));
    const combined = hints
        .map((h) => (h.textContent === "_" ? "[a-z]" : h.textContent))
        .join("");

    if (hints.every((h) => h.classList.contains("uncover"))) {
        return storeAnswer(combined);
    }

    const regex = new RegExp(`^${combined}$`, "i");
    return words.filter((w) => regex.test(w));
}

function observeHints() {
    const target = document.querySelector(".hints .container");
    if (!target) return;

    const observer = new MutationObserver(() => {
        possibleWords = filterHints(possibleWords);
        generateGuesses();
    });

    observer.observe(target, { childList: true, subtree: true });
}

observeHints();

// ---------------------------
// Levenshtein (Banded)
// ---------------------------

function levenshteinDistance(a, b, k = 1) {
    if (a.length > b.length) [a, b] = [b, a];

    let m = a.length,
        n = b.length;
    if (n - m > k) return -1;

    let start = 0;
    while (start < m && a[start] === b[start]) start++;

    let endA = m - 1,
        endB = n - 1;
    while (endA >= start && a[endA] === b[endB]) endA--, endB--;

    m = endA - start + 1;
    n = endB - start + 1;
    if (m === 0) return n;

    const buf = new Uint8Array((m + 1) * 2);
    const D0 = buf.subarray(0, m + 1);
    const D1 = buf.subarray(m + 1);

    for (let j = 0; j <= m; j++) D0[j] = j;

    for (let i = 1; i <= n; i++) {
        const curr = i & 1 ? D1 : D0;
        const prev = i & 1 ? D0 : D1;

        let lo = Math.max(1, i - k);
        let hi = Math.min(m, i + k);

        curr[lo - 1] = i;

        let rowMin = k + 1;
        const b_i = b[start + i - 1];

        for (let j = lo; j <= hi; j++) {
            const cost = a[start + j - 1] === b_i ? 0 : 1;
            const val = Math.min(
                curr[j - 1] + 1,
                prev[j] + 1,
                prev[j - 1] + cost
            );
            curr[j] = val;
            if (val < rowMin) rowMin = val;
        }

        if (rowMin > k) return -1;
    }

    const result = (n & 1 ? D1 : D0)[m];
    return result > k ? -1 : result;
}

// ---------------------------
// Chat Logic
// ---------------------------

let previousWords = [];

function handleChatMessage(node) {
    const color = window.getComputedStyle(node).color;
    const msg = node.textContent;

    if (color === "rgb(57, 117, 206)" && msg.endsWith("is drawing now!")) {
        possibleWords = filterHints(correctAnswers);
        // New round started
        stats.totalRounds++;
        saveStats();
    } else if (msg.includes(": ")) {
        const [user, guess] = msg.split(": ");
        possibleWords = possibleWords.filter((w) => w !== guess);
        previousWords = possibleWords;

        if (user === myUsername) {
            // Track user's guesses
            stats.totalGuesses++;
            saveStats();
            
            possibleWords = possibleWords.filter(
                (w) => levenshteinDistance(w, guess) === -1
            );
        }
    } else if (color === "rgb(226, 203, 0)" && msg.endsWith("is close!")) {
        const closeWord = msg.replace(" is close!", "");
        possibleWords = previousWords.filter(
            (w) => levenshteinDistance(w, closeWord) === 1
        );
    } else {
        return;
    }

    generateGuesses();
}

function observeChat() {
    const target = document.querySelector(".chat-content");
    if (!target) return;

    const observer = new MutationObserver(() => {
        handleChatMessage(target.lastElementChild);
    });

    observer.observe(target, { childList: true });
}

observeChat();

// ---------------------------
// Auto Guessing
// ---------------------------

let autoGuessing = false;
let autoGuessInterval = null;

function startAutoGuessing() {
    if (!autoGuessing) return;

    autoGuessInterval = setInterval(() => {
        // Check confidence threshold
        if (settings.confidenceThreshold > 0 && possibleWords.length > settings.confidenceThreshold) {
            // Too many possibilities, wait for more hints
            return;
        }
        
        if (possibleWords.length > 0) {
            input.value = possibleWords.shift();
            input.closest("form").dispatchEvent(new Event("submit", { bubbles: true }));
        }
    }, settings.autoGuessTimer);
}

const autoGuessButton = document.getElementById("auto-guess");

autoGuessButton.addEventListener("click", () => {
    autoGuessing = !autoGuessing;
    autoGuessButton.textContent = `Auto Guess: ${autoGuessing ? "ON" : "OFF"}`;

    if (autoGuessing) startAutoGuessing();
    else clearInterval(autoGuessInterval);
});

})();