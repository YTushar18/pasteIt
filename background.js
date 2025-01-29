chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ clipboard: [] });
    console.log("Smart Clipboard Extension Installed.");
});

// Listener for copy event messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background:", message);
    if (message.action === "copy_text" && sender.tab) {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            function: () => {
                document.execCommand("copy");
            }
        });
        sendResponse({ status: "Copied!" });
    } else {
        sendResponse({ status: "No action taken." });
    }
});