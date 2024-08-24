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

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateOverallSentiment') {
        const overallSentiment = request.overallSentiment !== undefined ? request.overallSentiment : 0;
        document.getElementById('overall-sentiment').textContent = `Overall Crypto Sentiment: ${overallSentiment.toFixed(2)}`;
    }
});
