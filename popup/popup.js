document.addEventListener("DOMContentLoaded", () => {
    let clipboardList = document.getElementById("clipboard-list");
    let clearButton = document.getElementById("clearClipboard");

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
});