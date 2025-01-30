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
    popup.style.padding = "12px";
    popup.style.boxShadow = "0px 4px 8px rgba(0,0,0,0.2)";
    popup.style.borderRadius = "8px";
    popup.style.maxWidth = "400px"; 
    popup.style.zIndex = "10000";
    popup.style.display = "flex"; // 🛠 Change to horizontal layout
    popup.style.flexWrap = "wrap"; // 🛠 Allow text tags to wrap if necessary
    popup.style.alignItems = "center"; // 🛠 Keep everything aligned
    popup.style.maxWidth = "600px"; // 🛠 Increase width for horizontal layout
    popup.style.gap = "12px"; // 🛠 Add space between elements
    popup.style.overflowX = "hidden"; // 🛠 Hide horizontal scrollbar
    popup.style.overflowY = "auto"; // 🛠 Add vertical scrollbar if neede
    popup.style.maxHeight = "200px"; // 🛠 Limit height to prevent overflow

    let rect = targetField.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 8}px`; // 🛠 Keep good spacing from input
    popup.style.left = `${rect.left + window.scrollX}px`;

    // Create close button (X)
    let closeButton = document.createElement("span");
    closeButton.innerText = "✖";
    closeButton.style.position = "absolute";
    closeButton.style.top = "2px";
    closeButton.style.right = "2px";
    closeButton.style.fontSize = "6px"; // 🛠 Reduce size
    closeButton.style.color = "#fff";
    closeButton.style.background = "red";
    closeButton.style.padding = "3px 6px"; // 🛠 Adjust padding for better size
    closeButton.style.borderRadius = "50%";
    closeButton.style.cursor = "pointer";
    closeButton.style.zIndex = "10001"; // 🛠 Ensure it's above text

    closeButton.addEventListener("click", () => {
        console.log("Popup closed.");
        popup.remove();
    });

    popup.appendChild(closeButton);

    // Add text snippets as clickable buttons with delete option
    clipboardData.forEach((text, index) => {
        let tagContainer = document.createElement("div");
        tagContainer.style.display = "flex";
        tagContainer.style.alignItems = "center";
        tagContainer.style.position = "relative";
        tagContainer.style.width = "auto"; // 🛠 Allow tags to gro
        // w

        let tag = document.createElement("span");
        tag.innerText = text;
        tag.style.padding = "6px 10px";
        tag.style.border = "1px solid #007bff";
        tag.style.background = "#007bff";
        tag.style.color = "#fff";
        tag.style.borderRadius = "5px";
        tag.style.cursor = "pointer";
        tag.style.fontSize = "14px";
        tag.style.whiteSpace = "normal"; // 🛠 Allow text to wra
        tag.style.wordWrap = "break-word"; // 🛠 Break long word
        tag.style.maxWidth = "100%"; // 🛠 Allow tag to grow
        tag.style.marginRight = "5px"; //check !

        tag.addEventListener("click", () => {
            console.log("Pasting text:", text);
            targetField.value = text;
            popup.remove();
        });

        // Add delete (X) button
        let deleteButton = document.createElement("span");
        deleteButton.innerText = "✖";
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "50%";
        deleteButton.style.transform = "translateY(-50%)";
        deleteButton.style.right = "-10px";
        deleteButton.style.fontSize = "6px"; // 🛠 Smaller delete button
        deleteButton.style.color = "#fff";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.background = "red";
        deleteButton.style.padding = "3px 5px";
        deleteButton.style.borderRadius = "50%";
        deleteButton.style.zIndex = "10001";
        deleteButton.style.display = "none"; // 🛠 Initially hidden

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
    setTimeout(() => {
        document.addEventListener("click", (event) => {
            if (!popup.contains(event.target) && event.target !== targetField) {
                console.log("Popup removed (click outside).");
                popup.remove();
            }
        }, { once: true });
    }, 100); // Delay ensures we don't close immediately after opening

    document.body.appendChild(popup);
    console.log("Popup added to DOM.");
}