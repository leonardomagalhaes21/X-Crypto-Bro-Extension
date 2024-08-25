const COINCAP_API_BASE_URL = "https://api.coincap.io/v2/assets";

async function fetchCoinData(coin) {
    try {
        const response = await fetch(`${COINCAP_API_BASE_URL}/${coin}`);
        if (!response.ok) {
            return {
                price: "-",
                changePercent24Hr: "-",
                symbol: "-"
            };
        }

        const data = await response.json();

        if (data.error || !data.data || !data.data.priceUsd || !data.data.changePercent24Hr || !data.data.symbol) {
            return {
                price: "-",
                changePercent24Hr: "-",
                symbol: "-"
            };
        }

        const price = parseFloat(data.data.priceUsd).toFixed(2);
        const changePercent24Hr = parseFloat(data.data.changePercent24Hr).toFixed(2);
        const symbol = data.data.symbol.toUpperCase();

        return {
            price: price,
            changePercent24Hr: changePercent24Hr,
            symbol: symbol
        };
    } catch (error) {
        return {
            price: "-",
            changePercent24Hr: "-",
            symbol: "-"
        };
    }
}
