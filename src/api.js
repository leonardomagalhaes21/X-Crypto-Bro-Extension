const COINCAP_API_BASE_URL = "https://api.coincap.io/v2/assets";

async function fetchAllCoinsData() {
    try {
        const response = await fetch(COINCAP_API_BASE_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        if (data.error || !data.data || !Array.isArray(data.data)) {
            throw new Error("Invalid data format");
        }

        const coinDataMap = {};
        data.data.forEach(coin => {
            coinDataMap[coin.id] = {
                price: parseFloat(coin.priceUsd).toFixed(2),
                changePercent24Hr: parseFloat(coin.changePercent24Hr).toFixed(2),
                symbol: coin.symbol.toUpperCase()
            };
        });

        return coinDataMap;
    } catch (error) {
        console.error("Error fetching data:", error);
        return {};
    }
}

function getCoinData(coin, allCoinsData) {
    if (allCoinsData[coin]) {
        return allCoinsData[coin];
    } else {
        return {
            price: "-",
            changePercent24Hr: "-",
            symbol: "-"
        };
    }
}
