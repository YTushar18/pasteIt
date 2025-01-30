console.log("Smart Clipboard background script loaded!");

// Initialize clipboard storage when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get({ clipboard: [] }, (data) => {
        if (!data.clipboard) {
            chrome.storage.local.set({ clipboard: [] });
        }
    });
    console.log("Smart Clipboard Extension Installed.");
});

// Ensure clipboard persists when Chrome starts
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get({ clipboard: [] }, (data) => {
        console.log("Restored clipboard on startup:", data.clipboard);
    });

    // Reinject content script into all active tabs on startup
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            if (tab.url && tab.id) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"]
                }).catch(err => console.warn("Error injecting script:", err));
            }
        }
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background:", message);

    if (message.action === "copy_text" && sender.tab) {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            function: () => {
                document.execCommand("copy");
            }
        }).catch(err => console.warn("Error executing copy:", err));

        sendResponse({ status: "Copied!" });
    } else {
        sendResponse({ status: "No action taken." });
    }
});

// Optional: Auto-clear clipboard after a set time (future feature)
function autoClearClipboard(minutes) {
    setTimeout(() => {
        chrome.storage.local.set({ clipboard: [] }, () => {
            console.log(`Clipboard auto-cleared after ${minutes} minutes.`);
        });
    }, minutes * 60 * 1000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "reloadContentScript") {
        console.log("Reloading content script...");
        sendResponse({ status: "Content script reload attempted." });
    }
});