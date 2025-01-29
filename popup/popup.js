document.addEventListener("DOMContentLoaded", () => {
    const clipboardList = document.getElementById("clipboard-list");
    const clearClipboardBtn = document.getElementById("clearClipboard");

    function loadClipboard() {
        chrome.storage.local.get("clipboard", ({ clipboard }) => {
            clipboardList.innerHTML = "";
            clipboard.forEach(text => {
                let item = document.createElement("div");
                item.className = "clipboard-item";
                item.innerText = text;
                item.addEventListener("click", () => {
                    navigator.clipboard.writeText(text);
                });
                clipboardList.appendChild(item);
            });
        });
    }

    clearClipboardBtn.addEventListener("click", () => {
        chrome.storage.local.set({ clipboard: [] }, () => {
            loadClipboard();
        });
    });

    loadClipboard();
});