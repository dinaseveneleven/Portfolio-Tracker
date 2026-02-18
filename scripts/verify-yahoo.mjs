import yahooFinance from 'yahoo-finance2';

async function testPrice() {
    console.log("Testing connection to Yahoo Finance (ES Module)...");
    try {
        // @ts-ignore
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
        console.error(error);
        console.error("--------------------------------");
    }
}

testPrice();
