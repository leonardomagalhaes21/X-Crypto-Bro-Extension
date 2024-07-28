document.getElementById('toggleSwitch').addEventListener('change', (event) => {
    const visible = event.target.checked;
    chrome.storage.local.set({ sentimentVisible: visible }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleVisibility', visible });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('sentimentVisible', (data) => {
        if (data.sentimentVisible !== undefined) {
            document.getElementById('toggleSwitch').checked = data.sentimentVisible;
        } else {
            document.getElementById('toggleSwitch').checked = true; // Default to true if not set
        }
    });
});
