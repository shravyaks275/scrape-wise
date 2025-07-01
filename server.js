const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const bodyParser = require('body-parser');
const cors = require('cors');
const Sentiment = require('sentiment'); // Sentiment analysis
const cron = require('node-cron');
const fs = require('fs');
const app = express();
const os = require("os"); // ✅ For system resource monitoring
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
let users = [
    { username: "admin", role: "Admin", password: "admin123" },
    { username: "1", role: "User", password: "123" },
    { username: "2", role: "User", password: "234" }
];

puppeteer.use(StealthPlugin());
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.post('/scrape', async (req, res) => {
    const { username, urls } = req.body;
    if (!username || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).send({ error: "Username and valid URLs required." });
    }

    try {
        const scrapedData = await Promise.all(urls.map(scrapeWebsite));
        fs.writeFileSync("scrapedData.json", JSON.stringify(scrapedData, null, 2));

        res.status(200).send({ message: "Scraping successful", data: scrapedData });
    } catch (error) {
        console.error("Scraping Error:", error);
        res.status(500).send({ error: "Scraping failed." });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).send({ message: "Invalid username or password." });
    }

    res.status(200).send({ message: `Welcome, ${username}!`, role: user.role });
});
app.post('/logout', (req, res) => {
    if (!req.cookies.session) {
        return res.status(400).send({ error: "No active session found" });
    }

    res.clearCookie('session', { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.status(200).send({ message: "Logged out successfully" });

    // Optional: Redirect user to login page (if frontend exists)
    res.redirect('/login');
});

app.post('/save-scraped-data', (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).send({ error: "No data received for saving." });
        }

        fs.writeFileSync(path.join(__dirname, 'scrapedData.json'), JSON.stringify(data, null, 2));
        res.status(200).send({ message: "Scraped data saved successfully." });
    } catch (error) {
        console.error("Error saving scraped data:", error);
        res.status(500).send({ error: "Failed to save scraped data." });
    }
});

// ========================== ADMIN API ========================== //

let blockedUsers = [];
let scrapingLogs = {};

// Get registered users
app.get('/admin/users', (req, res) => {
    res.status(200).send({ users });
});

// Block a user
app.post('/admin/block-user', (req, res) => {
    const { userId } = req.body;
    blockedUsers.push(userId);
    res.status(200).send({ message: `User ${userId} blocked successfully.` });
});



function saveLogsToFile() {
    fs.writeFileSync('scrapingLogs.json', JSON.stringify(scrapingLogs, null, 2));
}

function loadLogsFromFile() {
    if (fs.existsSync('scrapingLogs.json')) {
        scrapingLogs = JSON.parse(fs.readFileSync('scrapingLogs.json'));
    }
}

// ✅ Ensure logs load when server starts
loadLogsFromFile();

app.get('/admin/scraping-logs', (req, res) => {
    const { username } = req.query;

    if (!username || !scrapingLogs[username]) {
        return res.status(400).send({ error: "No logs found for this user" });
    }

    res.status(200).send({ logs: scrapingLogs[username] });
});

// View scraping logs
app.get('/admin/scraping-logs', (req, res) => {
    const { username } = req.query;

    if (!username || !scrapingLogs[username]) {
        return res.status(400).send({ error: "No logs found for this user" });
    }

    res.status(200).send({ logs: scrapingLogs[username] });
});

// Check server health status
app.get('/admin/server-status', (req, res) => {
    res.status(200).send({ status: "Running" });
});



// ========================== WEB SCRAPING FUNCTION ========================== //

async function getSelectors(domain) {
    const knownSelectors = {
        'example.com': {
            productTitle: '.product-title',
            price: '.price-tag',
            reviews: '.review-text span',
            rating: '.rating-stars',
            countryOrigin: '.country-of-origin',
        },
        'example2.com': {
            productTitle: '.productName',
            price: '.priceValue',
            reviews: '.userReviews',
            rating: '.starsRating',
            countryOrigin: '.country-of-origin',
        },
    };

    return knownSelectors[domain] || {
        productTitle: '#productTitle',
        price: '.a-price-whole',
        reviews: '.review-text-content span',
        rating: '.a-icon-alt',
        countryOrigin: '[data-country], .manufacturer-country', // ✅ Added alternate selectors
    };
}

// Scrape website data
async function scrapeWebsite(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        const domain = new URL(url).hostname;
        const selectors = await getSelectors(domain);

        await page.setRequestInterception(true);
        page.on('request', req => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

        await page.waitForSelector(selectors.productTitle);


        const productTitle = await page.$eval(selectors.productTitle, el => el.textContent.trim()).catch(() => 'Unknown Product');
        const priceWhole = await page.$eval(selectors.price, el => el.textContent.trim()).catch(() => 'Unknown Price');
        const reviews = await page.$$eval(selectors.reviews, elements => elements.map(el => el.textContent.trim())).catch(() => []);
        const rating = await page.$eval(selectors.rating, el => el.textContent.trim()).catch(() => 'Unknown Rating');
        const countryOrigin = await page.$eval(selectors.countryOrigin, el => el.textContent.trim()).catch(() => 'Unknown Country');



        const reviewCount = reviews.length;
        const reviewToSalesRatio = 0.05; // 5% of buyers leave reviews
        const estimatedSales = Math.round(reviewCount / reviewToSalesRatio);

        let positive = 0, neutral = 0, negative = 0;
        const sentimentAnalyzer = new Sentiment();

        reviews.forEach(review => {
            const sentiment = sentimentAnalyzer.analyze(review);
            if (sentiment.score > 0) positive++;
            else if (sentiment.score < 0) negative++;
            else neutral++;
        });

        await browser.close();

        return {
            productTitle,
            price: priceWhole,
            sentimentSummary: { positive, neutral, negative },
            reviewsCount: reviewCount,
            rating,
            estimatedSales,
            countryOrigin
            
        };
    } catch (error) {
        console.error('Scraping failed:', error);
        await browser.close();
        return {
            productTitle: 'Unknown Product',
            price: 'Unknown Price',
            sentimentSummary: { positive: 0, neutral: 0, negative: 0 },
            reviewsCount: 0,
            rating: 'Unknown Rating',
            estimatedSales: 0,
            countryOrigin: 'Unknown COuntry',

        };
    }
}

// ========================== SCRAPE API ROUTE ========================== //

app.post('/scrape', async (req, res) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
        return res.status(400).send({ error: 'Invalid input. Provide valid URLs.' });
    }

    try {
        const scrapedData = await Promise.all(urls.map(scrapeWebsite));
        res.status(200).send({ message: 'Scraping successful', data: scrapedData.filter(item => item !== null) });
        fs.writeFileSync("scrapedData.json", JSON.stringify(scrapedData, null, 2));

    }
    catch (error) {
        console.error('API Error:', error);
        res.status(500).send({ error: 'Scraping process failed.' });
    }
});

// ========================== COMPARISON API ROUTE ========================== //

app.post('/compare', async (req, res) => {
    const { urls } = req.body;
    if (!urls || urls.length !== 2) {
        return res.status(400).send({ error: 'Provide exactly two URLs for comparison.' });
    }

    try {
        const products = await Promise.all(urls.map(scrapeWebsite));

        if (products.some(product => product.price === 'Unknown Price')) {
            return res.status(400).send({ error: 'Unable to fetch price for one or more products.' });
        }

        // Parse price values
        function parsePrice(priceString) {
            return parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;
        }

        const price1 = parsePrice(products[0].price);
        const price2 = parsePrice(products[1].price);
        const priceDifference = Math.abs(price1 - price2);
        
        // ✅ Add comparison object here before sending response
        const comparison = {
            product1: {
                title: products[0]?.productTitle || "Not Available",
                price: price1,
                country: products[0]?.countryOrigin || "Unknown",
                rating: products[0]?.rating || "Not Available",
                reviewsCount: products[0]?.reviewsCount || "Not Available"
            },
            product2: {
                title: products[1]?.productTitle || "Not Available",
                price: price2,
                country: products[1]?.countryOrigin || "Unknown",
                rating: products[1]?.rating || "Not Available",
                reviewsCount: products[1]?.reviewsCount || "Not Available"
            },
            priceDifference
        };

               res.status(200).send({ message: 'Comparison successful', data: comparison });
    } catch (error) {
        console.error('Comparison Error:', error);
        res.status(500).send({ error: 'Comparison process failed.' });
    }
});

const path = require('path');

app.get('/admin/download-logs', (req, res) => {
    const filePath = path.join(__dirname, 'scrapingLogs.json');

    // ✅ Check if the file exists before sending
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'scrapingLogs.json');
    } else {
        res.status(404).send({ error: "Log file not found." });
    }
});

// =========================Save logs to file===========================//
app.post('/scrape', async (req, res) => {
    // After scraping:
    saveLogsToFile(); 
});
//=========================automate=================================//
cron.schedule('0 8 * * *', async () => {  /*The cron syntax specifies when to run the task:

                                            0 8 * * * → Run every day at 8:00 AM.
    
                                            *//*5 * * * * → Run every 5 minutes.
    
                                             0 0 * * 0 → Run every Sunday at midnight.*/
    console.log('Starting scheduled scraping task...');
    const newData = await scrapeWebsite(url); // Scrape new data
    mergeData(newData, product_data); // Merge new data with existing JSON file
});

console.log('Scraper is running and scheduled to scrape daily at 8:00 AM.');
//========================server health======================//

app.get("/admin/server-health", (req, res) => {
    const healthStatus = {
        status: "Server is running in good health ✅",
        uptime: `${Math.floor(process.uptime() / 60)} minutes`,
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        cpuUsage: os.loadavg().map(load => load.toFixed(2)).join(", "),
    };

    res.status(200).json(healthStatus);
});




// ========================== START SERVER ========================== //

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
