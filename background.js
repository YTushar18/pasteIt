// ?? Ensure we remove all existing menu items before adding new ones
chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
});

function createContextMenu() {
    chrome.contextMenus.removeAll(() => { // ✅ Clears old menu items before adding new ones
        console.log("✅ Cleared existing context menu items");

        // ?? Create main "PasteIt" menu
        chrome.contextMenus.create({
            id: "pasteit",
            title: "PasteIt",
            contexts: ["editable"]
        });

        // ?? Add clipboard items dynamically
        chrome.storage.local.get("clipboard", (data) => {
            let clipboardItems = data.clipboard || [];
            clipboardItems.forEach((text, index) => {
                chrome.contextMenus.create({
                    id: `pasteit-${index}`,
                    parentId: "pasteit",
                    title: text.length > 30 ? text.substring(0, 30) + "..." : text, // Truncate long text
                    contexts: ["editable"]
                });
            });
        });

        // ?? Add "Clear Clipboard" Option
        chrome.contextMenus.create({
            id: "clear_clipboard",
            parentId: "pasteit",
            title: "🗑️ Clear Clipboard",
            contexts: ["editable"]
        });
    });
}

// ?? Handle right-click menu actions
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId.startsWith("pasteit-")) {
        chrome.storage.local.get("clipboard", (data) => {
            let clipboardItems = data.clipboard || [];
            let index = parseInt(info.menuItemId.replace("pasteit-", ""), 10);
            let selectedText = clipboardItems[index];

            if (selectedText) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: pasteTextIntoField,
                    args: [selectedText]
                });
            }
        });
    } else if (info.menuItemId === "clear_clipboard") {
        chrome.storage.local.set({ clipboard: [] }, () => {
            createContextMenu(); // ✅ Refresh context menu after clearing
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: closeClipboardPopup
            });
        });
    }
});

// ?? Function to insert text into focused input field
function pasteTextIntoField(text) {
    let activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        activeElement.value = text;
        activeElement.dispatchEvent(new Event("input", { bubbles: true }));
    }
}

// ?? Close clipboard popup function
function closeClipboardPopup() {
    let popup = document.getElementById("clipboard-popup");
    if (popup) popup.remove();
}

// ?? Auto-update context menu when clipboard changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.clipboard) {
        createContextMenu();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        if (!tab.url.startsWith("https://chrome.google.com/webstore") && !tab.url.startsWith("chrome://")) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["content.js"]
            }).catch(err => console.warn("Script execution blocked:", err));
        }
    }
});