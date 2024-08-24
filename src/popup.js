document.getElementById('toggleSwitch').addEventListener('change', (event) => {
    const visible = event.target.checked;
    chrome.storage.local.set({ sentimentVisible: visible }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleVisibility', visible });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['sentimentVisible', 'overallSentiment'], (data) => {
        if (data.sentimentVisible !== undefined) {
            document.getElementById('toggleSwitch').checked = data.sentimentVisible;
        } else {
            document.getElementById('toggleSwitch').checked = true; // Default to true if not set
        }

        const overallSentiment = data.overallSentiment !== undefined ? data.overallSentiment : 0;
        document.getElementById('overall-sentiment').textContent = `Overall Crypto Sentiment: ${overallSentiment.toFixed(2)}`;
    });
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.sentimentVisible) {
            document.getElementById('toggleSwitch').checked = changes.sentimentVisible.newValue;
        }

        if (changes.overallSentiment) {
            const overallSentiment = changes.overallSentiment.newValue !== undefined ? changes.overallSentiment.newValue : 0;
            document.getElementById('overall-sentiment').textContent = `Overall Crypto Sentiment: ${overallSentiment.toFixed(2)}`;
        }
    }
});
