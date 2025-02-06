document.addEventListener("DOMContentLoaded", () => {
    let clipboardList = document.getElementById("clipboard-list");
    let clearButton = document.getElementById("clearClipboard");
    let popupToggle = document.getElementById("popupToggle"); 

    // ?? Load Mute State from Storage
    chrome.storage.local.get({ isMuted: false }, (data) => {
        updateMuteButton(data.isMuted);
    });

    // ?? Toggle Mute Setting
    muteToggle.addEventListener("click", () => {
        chrome.storage.local.get("isMuted", (data) => {
            let newMuteState = !data.isMuted;
            chrome.storage.local.set({ isMuted: newMuteState }, () => {
                updateMuteButton(newMuteState);
            });
        });
    });

    // ?? Update Mute Button UI
    function updateMuteButton(isMuted) {
        muteToggle.innerText = isMuted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
    }

    // ?? Load saved clipboard items
    chrome.storage.local.get("clipboard", ({ clipboard }) => {
        if (clipboard && clipboard.length > 0) {
            clipboard.forEach(text => {
                let tag = document.createElement("div");
                tag.classList.add("clipboard-tag");
                tag.textContent = text;

                // ?? Click to copy feature
                tag.addEventListener("click", () => {
                    navigator.clipboard.writeText(text);
                    // console.log("Copied to clipboard:", text);
                });

                clipboardList.appendChild(tag);
            });
        } else {
            clipboardList.innerHTML = "<p>No saved clips</p>";
        }
    });

    // ?? Clear clipboard function
    clearButton.addEventListener("click", () => {
        chrome.storage.local.set({ clipboard: [] }, () => {
            clipboardList.innerHTML = "<p>Clipboard cleared</p>";
            // console.log("Clipboard cleared");
            // ?? Close the currently open clipboard popup
            let existingPopup = document.getElementById("clipboard-popup");
            if (existingPopup) {
                // console.log("Removing existing popup");
                existingPopup.remove();  // ✅ Instantly removes the popup
            }
        });
    });

    // ?? Load popup visibility state
    chrome.storage.local.get({ popupEnabled: true }, (data) => {
        popupToggle.checked = data.popupEnabled;
    });

// ?? Toggle popup visibility instantly
popupToggle.addEventListener("change", () => {
    let isEnabled = popupToggle.checked;
    chrome.storage.local.set({ popupEnabled: isEnabled });

    // ?? Send message to content scripts to apply change immediately
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (enabled) => {
                    window.localStorage.setItem("popupEnabled", enabled);
                },
                args: [isEnabled]
            });
        });
    });
});

    // ?? Clear Clipboard and Close Popup
    clearButton.addEventListener("click", () => {
        chrome.storage.local.set({ clipboard: [] }, () => {
            clipboardList.innerHTML = "<p>Clipboard cleared</p>";
            chrome.runtime.sendMessage({ action: "closeClipboardPopup" });
        });
    });
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = tabs[0].url;

    if (url.startsWith("chrome://") || url.includes("chrome.google.com/webstore")) {
        // console.warn("❌ Cannot run exten/sion on this page.");
        document.body.innerHTML = "<p>⚠️ This extension cannot be used on this page.</p>";
    }
});