document.getElementById('toggleSwitch').addEventListener('change', (event) => {
    const visible = event.target.checked;
    chrome.storage.local.set({ sentimentVisible: visible }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleVisibility', visible });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['sentimentVisible', 'overallSentiment', 'coinData'], (data) => {
        if (data.sentimentVisible !== undefined) {
            document.getElementById('toggleSwitch').checked = data.sentimentVisible;
        } else {
            document.getElementById('toggleSwitch').checked = true; // Default to true if not set
        }

        const overallSentiment = data.overallSentiment !== undefined ? data.overallSentiment : 0;
        document.getElementById('overall-sentiment').textContent = `Overall Crypto Sentiment: ${overallSentiment.toFixed(2)}`;

        if (data.coinData) {
            updateSentimentTable(data.coinData);
        }
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

        if (changes.coinData) {
            updateSentimentTable(changes.coinData.newValue);
        }
    }
});

function updateSentimentTable(coinData) {
    if (!coinData || typeof coinData !== 'object' || Object.keys(coinData).length === 0) {
        return;
    }

    const table = document.getElementById('crypto-sentiment-table');
    const tbody = table.querySelector('tbody');

    tbody.innerHTML = '';
        
    for (const [coin, data] of Object.entries(coinData)) {
        if (data.tweetCount > 0) {
            const tr = document.createElement('tr');
            const price = isNaN(Number(data.price)) ? '-' : `$${Number(data.price).toFixed(2)}`;
            const symbol = data.symbol ? data.symbol.toUpperCase() : '-';
            const changePercent24Hr = isNaN(Number(data.changePercent24Hr)) ? '-' : `${Number(data.changePercent24Hr).toFixed(2)}%`;
            const averageSentiment = data.sentimentTotal / data.tweetCount;

            const cells = [
                coin,
                symbol,
                price,
                changePercent24Hr,
                averageSentiment.toFixed(2)
            ];

            cells.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        }
    }
}
