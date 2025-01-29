console.log("Smart Clipboard content script loaded!");

// Helper function to safely access chrome.storage.local
function getClipboardData(callback) {
    if (chrome?.runtime?.id) { // Ensures extension context is still valid
        chrome.storage.local.get({ clipboard: [] }, callback);
    } else {
        console.warn("Warning: Extension context invalidated. Reloading script...");
    }
}

// Capture copied text and store it in local storage
document.addEventListener("copy", async () => {
    let text = document.getSelection().toString().trim();
    console.log("Copied text:", text);

    if (text !== "") {
        getClipboardData((data) => {
            let clipboard = data.clipboard || [];
            if (!clipboard.includes(text)) {
                clipboard.push(text);
                chrome.storage.local.set({ clipboard }, () => {
                    console.log("Stored in clipboard:", clipboard);
                });
            }
        });
    }
});

// Show popup when clicking inside an input field
document.addEventListener("focusin", (event) => {
    let element = event.target;
    console.log("Focused on:", element.tagName);

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        getClipboardData(({ clipboard }) => {
            console.log("Showing popup for:", element);
            showClipboardPopup(element, clipboard || []);
        });
    }
});

// Function to display popup with clipboard text snippets
function showClipboardPopup(targetField, clipboardData) {
    console.log("Popup triggered, clipboard contains:", clipboardData);
    if (!clipboardData || clipboardData.length === 0) return;

    // Remove existing popup if any
    let existingPopup = document.getElementById("clipboard-popup");
    if (existingPopup) existingPopup.remove();

    // Create popup container
    let popup = document.createElement("div");
    popup.id = "clipboard-popup";
    popup.style.position = "absolute";
    popup.style.background = "#fff";
    popup.style.border = "1px solid #ccc";
    popup.style.padding = "10px";
    popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
    popup.style.borderRadius = "8px";
    popup.style.zIndex = "10000";
    popup.style.display = "flex";
    popup.style.flexWrap = "wrap";
    popup.style.maxWidth = "300px";
    popup.style.gap = "5px";

    let rect = targetField.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;

    // Add text snippets as clickable buttons with delete option
    clipboardData.forEach((text, index) => {
        let tagContainer = document.createElement("div");
        tagContainer.style.display = "flex";
        tagContainer.style.alignItems = "center";
        tagContainer.style.position = "relative";

        let tag = document.createElement("span");
        tag.innerText = text;
        tag.style.padding = "6px 10px";
        tag.style.border = "1px solid #007bff";
        tag.style.background = "#007bff";
        tag.style.color = "#fff";
        tag.style.borderRadius = "5px";
        tag.style.cursor = "pointer";
        tag.style.fontSize = "14px";
        tag.style.whiteSpace = "nowrap";
        tag.style.marginRight = "5px";

        tag.addEventListener("click", () => {
            console.log("Pasting text:", text);
            targetField.value = text;
            popup.remove();
        });

        // Add delete (X) button
        let deleteButton = document.createElement("span");
        deleteButton.innerText = "✖";
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "0px";
        deleteButton.style.right = "0px";
        deleteButton.style.fontSize = "12px";
        deleteButton.style.color = "#fff";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.background = "red";
        deleteButton.style.padding = "2px 5px";
        deleteButton.style.borderRadius = "50%";
        deleteButton.style.marginLeft = "5px";
        deleteButton.style.display = "none"; // Initially hidden

        // Show delete button on hover
        tagContainer.addEventListener("mouseenter", () => deleteButton.style.display = "inline-block");
        tagContainer.addEventListener("mouseleave", () => deleteButton.style.display = "none");

        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent tag click from firing
            clipboardData.splice(index, 1);
            chrome.storage.local.set({ clipboard: clipboardData }, () => {
                console.log("Removed item:", text);
                popup.remove(); // Re-render popup
                showClipboardPopup(targetField, clipboardData);
            });
        });

        tagContainer.appendChild(tag);
        tagContainer.appendChild(deleteButton);
        popup.appendChild(tagContainer);
    });

    // Close popup when clicking outside
    document.addEventListener("click", (event) => {
        if (!popup.contains(event.target) && event.target !== targetField) {
            console.log("Popup removed.");
            popup.remove();
        }
    }, { once: true });

    document.body.appendChild(popup);
    console.log("Popup added to DOM.");
}