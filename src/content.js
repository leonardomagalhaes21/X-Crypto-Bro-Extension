const sentiment = new Sentiment();

const cryptoKeywords = ['crypto', 'cryptocurrency', 'blockchain']; 
const coinNames = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'usd-coin', 'xrp', 'cardano', 'dogecoin', 'solana', 'polkadot', 'litecoin', 'polygon', 'shiba-inu', 'avalanche', 'wrapped-bitcoin', 'chainlink', 'uniswap', 'leo-token', 'cosmos', 'monero', 'stellar', 'bitcoin-cash', 'ethereum-classic', 'filecoin', 'aptos', 'hedera', 'internet-computer', 'arbitrum', 'quant', 'lido-dao', 'cronos', 'vechain', 'near-protocol', 'the-graph', 'apecoin', 'algorand', 'frax', 'fantom', 'decentraland', 'theta-network', 'immutable-x', 'axie-infinity', 'chiliz', 'kucoin-token', 'huobi-token', 'trust-wallet-token', 'pax-dollar', 'curve-dao-token'];

const coinData = {};

async function initializeCoinData() {
    const allCoinsData = await fetchAllCoinsData();
    for (const coin of coinNames) {
        coinInfo = getCoinData(coin, allCoinsData);
        coinData[coin] = {
            price: coinInfo.price,
            changePercent24Hr: coinInfo.changePercent24Hr,
            symbol: coinInfo.symbol,
            sentimentTotal: 0,
            tweetCount: 0
        };
    }
}

function analyzeCryptoContext(tweet) {
    let context = '';
    const lowerCaseTweet = tweet.toLowerCase();
    let foundCoins = [];

    coinNames.forEach(coin => {
        if (lowerCaseTweet.includes(coin)) {
            foundCoins.push(coin);
        }
    });

    if (foundCoins.length > 0) {
        context = 'about ' + foundCoins.join(', ');
    }
    else {
        for (const keyword of cryptoKeywords) {
            if (lowerCaseTweet.includes(keyword)) {
                context = 'about crypto';
                break;
            }
        }
    }
    
    return context;
}

function analyzeSentiment(tweet) {
    const result = sentiment.analyze(tweet);
    const score = result.score;
    return score;
}

function createSentimentIndicator(score, context) {
    const indicator = document.createElement('span');
    indicator.classList.add('sentiment-indicator');

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'sentiment-score';
    scoreSpan.textContent = `Score: ${score}`;
    
    if (score > 5) {
        indicator.classList.add('sentiment-very-positive');
        indicator.textContent = `Very Positive ${context}`;
    } else if (score > 0) {
        indicator.classList.add('sentiment-positive');
        indicator.textContent = `Positive ${context}`;
    } else if (score === 0) {
        indicator.classList.add('sentiment-neutral');
        indicator.textContent = `Neutral ${context}`;
    } else if (score > -5) {
        indicator.classList.add('sentiment-negative');
        indicator.textContent = `Negative ${context}`;
    } else if (score <= -5) {
        indicator.classList.add('sentiment-very-negative');
        indicator.textContent = `Very Negative ${context}`;
    }

    indicator.appendChild(scoreSpan);

    indicator.addEventListener('mouseenter', () => {
        scoreSpan.style.display = 'inline';
    });

    indicator.addEventListener('mouseleave', () => {
        scoreSpan.style.display = 'none';
    });
    
    return indicator;
}


function processTweetElement(tweetElement) {
    try{
        const tweetText = tweetElement.innerText;
        const context = analyzeCryptoContext(tweetText);
        const sentimentScore = analyzeSentiment(tweetText);
        const sentimentIndicator = createSentimentIndicator(sentimentScore, context);

        sentimentIndicator.style.display = 'none';

        chrome.storage.local.get('sentimentVisible', (data) => {
            const visible = data.sentimentVisible !== undefined ? data.sentimentVisible : true;
            sentimentIndicator.style.display = visible ? 'inline' : 'none';
        });
        
        tweetElement.parentElement.appendChild(sentimentIndicator);

        if (context !== "" && context !== "about crypto") {
            const foundCoins = context.substring(6).split(', ');
            for (const coin of foundCoins) {
                if (coinData[coin]) {
                    coinData[coin].sentimentTotal += sentimentScore;
                    coinData[coin].tweetCount++;
                }
            }
        }

        return {sentimentScore, context};
    }
    catch (e) {
        console.log("Error processing tweet element:", e);
    }
    
}

let totalScore = 0;
let cryptoTweetCount = 0;
let overallSentiment = 0;

function analyzeTweetsOnPage() {
    document.querySelectorAll('article div[lang]').forEach(tweetElement => {
        if (!tweetElement.hasAttribute('data-sentiment-checked')) {
            const {sentimentScore, context} =  processTweetElement(tweetElement);
            if (context !== "") {
                totalScore += sentimentScore;
                cryptoTweetCount++;
            }
            tweetElement.setAttribute('data-sentiment-checked', 'true');
        }
    });
    
    overallSentiment = cryptoTweetCount > 0 ? totalScore / cryptoTweetCount : 0;

    try {
        chrome.storage.local.set({
            overallSentiment: overallSentiment,
            coinData: coinData
        });
    }
    catch (e) {
        console.log("An error occurred while setting chrome storage:", e);
    }
    
}

function resetData() {
    totalScore = 0;
    cryptoTweetCount = 0;
    overallSentiment = 0;

    Object.keys(coinData).forEach(coin => {
        coinData[coin].sentimentTotal = 0;
        coinData[coin].tweetCount = 0;
    });

    chrome.storage.local.set({
        overallSentiment: 0,
        coinData: coinData
    });
}

function toggleSentimentVisibility(visible) {
    const indicators = document.querySelectorAll('.sentiment-indicator');
    indicators.forEach(indicator => {
        indicator.style.display = visible ? 'inline' : 'none';
    });
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    analyzeTweetsOnPage();
                }
            });
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

initializeCoinData();
analyzeTweetsOnPage();

chrome.storage.local.get('sentimentVisible', (data) => {
    const visible = data.sentimentVisible !== undefined ? data.sentimentVisible : true;
    toggleSentimentVisibility(visible);
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'toggleVisibility') {
        toggleSentimentVisibility(request.visible);
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'resetData') {
        console.log("Resetting data");
        resetData();
    }
});
