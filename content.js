console.log("PasteIt content script loaded!");

// Helper function to safely access chrome.storage.local
function getClipboardData(callback) {
    try {
        if (!chrome.runtime?.id) {
            throw new Error("⚠️ Extension context invalidated!");
        }

        chrome.storage.local.get({ clipboard: [] }, callback);
    } catch (error) {
        console.warn(error.message);
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

// Store last pasted value to prevent accidental clearing

let lastPastedValueMap = new WeakMap();

// Show popup when clicking inside an input field
document.addEventListener("focusin", (event) => {
    let element = event.target;
    console.log("Focused on:", element.tagName);

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        // Prevent clearing if the value was pasted by the extension
        // if (lastPastedValueMap.has(element) && element.value === lastPastedValueMap.get(element)) {
        //     console.log("Preserving pasted text. Not clearing.");
        //     return;
        // }

        getClipboardData(({ clipboard }) => {
            console.log("Showing popup for:", element);
            showClipboardPopup(element, clipboard || []);
        });
    }
});


// ?? Added new: Popup fade-out animation
function closeClipboardPopup() {
    let popup = document.getElementById("clipboard-popup");
    if (popup) {
        popup.style.opacity = "0";
        popup.style.transform = "scale(0.9)";
        setTimeout(() => popup.remove(), 200);
    }
}

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
    popup.style.minWidth = "300px"; // 🛠 Ensure a minimum width
    popup.style.gap = "12px"; // 🛠 Add space between elements
    popup.style.overflowX = "hidden"; // 🛠 Hide horizontal scrollbar
    popup.style.overflowY = "auto"; // 🛠 Add vertical scrollbar if neede
    popup.style.maxHeight = "200px"; // 🛠 Limit height to prevent overflow

    let rect = targetField.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 8}px`; // 🛠 Keep good spacing from input
    popup.style.left = `${rect.left + window.scrollX}px`;

    // ?? Force Apply Glass Effect
    popup.style.background = "rgba(20, 50, 90, 0.3)"; // ?? Glassy blue background
    popup.style.backdropFilter = "blur(2px)"; // ?? Frosted glass effect
    popup.style.border = "1px solid rgba(255, 255, 255, 0.2)";

    // Create close button (X)
    let closeButton = document.createElement("span");
    // closeButton.innerText = "✖";
    closeButton.innerText = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "2px";
    closeButton.style.right = "2px";
    closeButton.style.fontSize = "14px"; // 🛠 Reduce size
    closeButton.style.fontWeight = "bold"; // 🛠 Make it more visible
    closeButton.style.color = "#fff";
    closeButton.style.background = "red";
    closeButton.style.padding = "0px 5px"; // 🛠 Adjust padding for better size
    closeButton.style.borderRadius = "50%";
    closeButton.style.cursor = "pointer";
    closeButton.style.zIndex = "10001"; // 🛠 Ensure it's above text

    // ?? Add Zoom on Hover
    closeButton.addEventListener("mouseenter", () => {
        closeButton.style.transform = "scale(1.2)";
    });

    closeButton.addEventListener("mouseleave", () => {
        closeButton.style.transform = "scale(1)";
    });

    closeButton.addEventListener("click", () => {
        console.log("Popup closed.");
        popup.remove();
    });

    popup.appendChild(closeButton);

    // Create a container for draggable items
    let listContainer = document.createElement("div");
    listContainer.style.display = "flex";
    listContainer.style.flexWrap = "wrap";
    listContainer.style.width = "100%";
    listContainer.style.gap = "5px"; // 🛠 Add space between items

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
        tag.style.wordBreak = "break-all"; // 🛠 Break long words
        tag.style.maxWidth = "100%"; // 🛠 Allow tag to grow
        tag.style.marginRight = "5px"; //check !
        tag.style.userSelect = "none"; // Prevents accidental text selection
        tag.draggable = true; // Enable drag & drop
        // tag.dataset.index = index; // Store original index
        tag.setAttribute("data-index", index); // ?? Ensures attribute is properly set
        console.log("Set index for:", tag.innerText, "->", index); // Debugging

        // ?? Hover Effect (Zoom)
        tag.addEventListener("mouseenter", () => {
            tag.style.transform = "scale(1.08)";
            tag.style.background = "linear-gradient(135deg, #0099ff, #0066cc)";
            tag.style.boxShadow = "0px 4px 12px rgba(0, 0, 0, 0.3)";
        });

        // ?? Reset Effect on Mouse Leave
        tag.addEventListener("mouseleave", () => {
            tag.style.transform = "scale(1)";
            tag.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
            tag.style.boxShadow = "none";
        });


        tag.addEventListener("click", () => {
            // Preserve existing text if already present
            // if (targetField.value.trim() === "" || targetField.value === lastPastedValueMap.get(targetField)) {
            //     targetField.value = text; // Paste text
            //     lastPastedValueMap.set(targetField, text); // Store last pasted value
            // } else {
            //     console.log("Field already has user-edited content. Not overwriting.");
            // }
            // Replace the text in the field only when a tag is selected
            targetField.value = text; 
            targetField.focus(); // Ensure focus stays in the field after pasting
            popup.remove();
        });

        // ?? Added new: Add shadow effect while dragging
        tag.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/plain", event.target.dataset.index);
            // tag.classList.add("dragging"); // Apply shadow effect
            // console.log("Dragging started:", tag.innerText); // Debugging
            setTimeout(() => {
                tag.classList.add("dragging"); // ?? Force-add class after a small delay
            }, 10);
        
            console.log("Dragging started:", tag.innerText);
        });

        tag.addEventListener("dragend", (event) => {
            // tag.classList.remove("dragging"); // ?? Ensure class is removed
            // console.log("Dragging ended"); // Debugging
            setTimeout(() => {
                tag.classList.remove("dragging");
            }, 10);
            console.log("Dragging ended");
        });

        tag.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        tag.addEventListener("drop", (event) => {
            event.preventDefault();
            let draggedIndex = event.dataTransfer.getData("text/plain");
            let targetIndex = event.target.dataset.index;

            if (draggedIndex !== targetIndex) {
                console.log(`Reordering from ${draggedIndex} to ${targetIndex}`);
                let newClipboard = [...clipboardData];
                let movedItem = newClipboard.splice(draggedIndex, 1)[0];
                newClipboard.splice(targetIndex, 0, movedItem);

                // ?? Save the new order in storage
                chrome.storage.local.set({ clipboard: newClipboard }, () => {
                    console.log("Clipboard reordered:", newClipboard);
                    closeClipboardPopup();
                    showClipboardPopup(targetField, newClipboard);
                });
            }
        });

        listContainer.appendChild(tag);

        // Add delete (X) button
        let deleteButton = document.createElement("span");
        deleteButton.innerText = "x";
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "50%";
        deleteButton.style.transform = "translateY(-50%)";
        deleteButton.style.right = "-10px";
        deleteButton.style.fontSize = "6px"; // 🛠 Smaller delete button
        deleteButton.style.fontSize = "10px"; // 🛠 Smaller delete button
        deleteButton.style.color = "#fff";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.background = "red";
        deleteButton.style.padding = "3px 5px";
        deleteButton.style.borderRadius = "50%";
        deleteButton.style.zIndex = "10001";
        deleteButton.style.display = "none"; // 🛠 Initially hidden

        // // ?? Hover Zoom Effect on Delete Button
        // deleteButton.addEventListener("mouseenter", () => {
        //     deleteButton.style.transform = "scale(1.2)";
        // });

        // deleteButton.addEventListener("mouseleave", () => {
        //     deleteButton.style.transform = "scale(1)";
        // });

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

    // ?? Ensure Popup Closes When Clicking Outside
    setTimeout(() => {
        document.addEventListener("click", (event) => {
            let clickedInsidePopup = popup.contains(event.target);
            let clickedOnInput = event.target === targetField;

            if (!clickedInsidePopup && !clickedOnInput) {
                console.log("Popup removed (click outside).");
                popup.remove();
            }
        }, { once: true });
    }, 100); // ?? Delay ensures we don’t close immediately after opening

    document.body.appendChild(popup);
    console.log("Popup added to DOM.");
}