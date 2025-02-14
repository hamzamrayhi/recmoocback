const express = require('express');
const router = express.Router();
const { AxePuppeteer } = require('axe-puppeteer');
const puppeteer = require('puppeteer'); // Import puppeteer

router.get('/runAxeCore', async (req, res) => {
    try {
        // Get the URL from query parameters
        const url = req.query.url;
        if (!url) {
            // If URL is not provided, send an error response
            return res.status(400).send('URL parameter is required');
        }

        // Launch a headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the provided URL
        await page.goto(url);

        // Run axe-core on the page
        const axeResults = await new AxePuppeteer(page).analyze();

        // Close the browser
        await browser.close();

        // Extract only the required fields from violations
        const filteredViolations = axeResults.violations.map(violation => ({
            impact: violation.impact,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl
        }));
        // Send filtered violations as response
        res.json(filteredViolations);
    } catch (error) {
        console.error(`Error executing Axe-core: ${error.message}`);
        res.status(500).send('Error executing Axe-core');
    }
});


module.exports = router;
