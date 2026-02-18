const yahooFinance = require('yahoo-finance2').default || require('yahoo-finance2');

async function testPrice() {
    console.log("Testing connection to Yahoo Finance...");
    try {
        // Suppress notices to see clean output
        yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical', 'validation']);

        const result = await yahooFinance.quote('AAPL');
        console.log("--------------------------------");
        console.log("SUCCESS! Real Data fetched:");
        console.log(`Symbol: ${result.symbol}`);
        console.log(`Price: $${result.regularMarketPrice}`);
        console.log(`Currency: ${result.currency}`);
        console.log("--------------------------------");
    } catch (error) {
        console.error("--------------------------------");
        console.error("ERROR fetching real data:");
        console.error(error.message || error);
        if (error.result) console.error("Partial result:", error.result);
        console.error("--------------------------------");
    }
}

testPrice();
