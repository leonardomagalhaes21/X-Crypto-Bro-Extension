document.getElementById('toggleSwitch').addEventListener('change', (event) => {
    const visible = event.target.checked;
    chrome.storage.local.set({ sentimentVisible: visible }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const url = tabs[0].url;
            if (url && (url.includes('twitter.com') || url.includes('x.com'))) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleVisibility', visible });
            } else {
                console.log('Not on Twitter/X. Toggle action ignored.');
            }
        });
    });
});


document.getElementById('resetButton').addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to reset the sentiment data?');

    if (confirmed) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const url = tabs[0].url;
            if (url && (url.includes('twitter.com') || url.includes('x.com'))) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'resetData' });
            } else {
                console.log('Not on Twitter/X. Reset action not done.');
            }
        });
    }
    else {
        console.log('Reset action cancelled by the user.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['sentimentVisible', 'overallSentiment', 'coinData'], (data) => {
        if (data.sentimentVisible !== undefined) {
            document.getElementById('toggleSwitch').checked = data.sentimentVisible;
        } else {
            document.getElementById('toggleSwitch').checked = true; // Default to true if not set
        }

        const overallSentiment = data.overallSentiment !== undefined ? data.overallSentiment : 0;
        value = (overallSentiment + 10) / 20;
        setGaugeValue(value);

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
            value = (overallSentiment + 10) / 20;
            setGaugeValue(value);
        }

        if (changes.coinData) {
            updateSentimentTable(changes.coinData.newValue);
        }
    }
});

function getClassFullName(className, value) {
    if (value > 0) {
        return className + '-positive';
    } else if (value < 0) {
        return className + '-negative';
    } else {
        return className + '-neutral';
    }
}

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
                {text: coin, className: 'coin'},
                {text: symbol, className: 'symbol'},
                {text: price, className: 'price'},
                {text: changePercent24Hr, className: getClassFullName('change-percent', Number(data.changePercent24Hr))},
                {text: averageSentiment.toFixed(2), className: getClassFullName('sentiment', averageSentiment)},
            ];

            cells.forEach(({text, className}) => {
                const td = document.createElement('td');
                const span = document.createElement('span');
                span.className = className;
                span.textContent = text;
                td.appendChild(span);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        }
    }
}


function setGaugeValue(value) {
    gauge = document.querySelector(".gauge");
    gauge_fill = document.querySelector(".gauge__fill");
    sentimentValue = document.querySelector(".gauge__cover .sentiment-value");

    if (value < 0 || value > 1) {
        return;
    }

    if (value < 0.4) {
        gauge_fill.style.background = "var(--dark-red)";
    }
    else if (value >= 0.4 && value < 0.5) {
        gauge_fill.style.background = "var(--red)";
    }
    else if (value === 0.5) {
        gauge_fill.style.background = "var(--gray)";
    }
    else if (value > 0.5 && value < 0.6) {
        gauge_fill.style.background = "var(--green)";
    }
    else {
        gauge_fill.style.background = "var(--dark-green)";
    }

    gauge_fill.style.transform = `rotate(${value / 2}turn)`;

    sentiment = (value * 20) - 10
    sentimentValue.textContent = sentiment.toFixed(2);
}

function exportTableToCSV() {
    const table = document.getElementById('crypto-sentiment-table');
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row) => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach((col) => rowData.push(col.innerText));
        csv.push(rowData.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'crypto_sentiment_data.csv');
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
}

document.getElementById('exportButton').addEventListener('click', exportTableToCSV);

