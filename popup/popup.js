document.addEventListener("DOMContentLoaded", () => {
    const clipboardList = document.getElementById("clipboard-list");
    const clearClipboardBtn = document.getElementById("clearClipboard");

    console.log("Popup loaded!");

    function loadClipboard() {
        chrome.storage.local.get({ clipboard: [] }, (data) => {
            clipboardList.innerHTML = "";
            let clipboard = data.clipboard || [];

            if (clipboard.length === 0) {
                clipboardList.innerHTML = "<p>No copied text yet.</p>";
                return;
            }

            clipboard.forEach(text => {
                let item = document.createElement("div");
                item.className = "clipboard-item";
                item.innerText = text;
                item.addEventListener("click", () => {
                    navigator.clipboard.writeText(text);
                });
                clipboardList.appendChild(item);
            });

            console.log("Loaded clipboard from storage:", clipboard);
        });
    }

    clearClipboardBtn.addEventListener("click", () => {
        console.log("Clear Clipboard button clicked!");
        chrome.storage.local.set({ clipboard: [] }, () => {
            loadClipboard();
        });
    });

    loadClipboard();
});