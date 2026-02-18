async function checkYahoo() {
    console.log("Starting connectivity check...");
    try {
        // Use dynamic import to handle ESM package in CJS environment
        const { default: yahooFinance } = await import('yahoo-finance2');

        console.log("Library imported. Suppressing notices...");
        // @ts-ignore
        yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical', 'validation']);

        console.log("Fetching quote for AAPL...");
        const quote = await yahooFinance.quote('AAPL');

        console.log("------------------------------------------");
        console.log("SUCCESS! Retrieved Real Data:");
        console.log(`Symbol: ${quote.symbol}`);
        console.log(`Price: ${quote.regularMarketPrice}`);
        console.log(`Currency: ${quote.currency}`);
        console.log("------------------------------------------");

    } catch (error) {
        console.error("------------------------------------------");
        console.error("FAILURE! Could not fetch real data.");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.errors) console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
        console.error("------------------------------------------");
    }
}

checkYahoo();
