# SCRAPE WISE

SCRAPE WISE is a Node.js-based tool that automates real-time product data extraction from e-commerce platforms. It performs sentiment analysis on customer reviews using Sentiment.js and visualizes insights like price trends and review polarity using Chart.js. Designed for smarter shopping and competitive market analysis, SCRAPE WISE combines modern web scraping with intuitive data presentation.
___
## Features

- 🔍 Real-time web scraping with Puppeteer (Stealth mode enabled)
- 💬 Sentiment analysis of customer reviews using Sentiment.js
- 📊 Interactive data visualization with Chart.js
- 🕒 Automated scraping schedules using node-cron
- 🔁 Round-robin proxy rotation for anti-bot evasion
- 🌐 Express.js backend with RESTful API endpoints
- 📁 JSON-based storage for scraped and analyzed data
___
## Tech Stack

| Layer         | Tools & Libraries                          |
|---------------|---------------------------------------------|
| Backend       | Node.js, Express.js                        |
| Scraping      | Puppeteer, Puppeteer Extra (Stealth Plugin)|
| Sentiment     | Sentiment.js                               |
| Scheduling    | node-cron                                  |
| Visualization | Chart.js                                   |
| Data Format   | JSON                                       |
___

## Project Structure

scrape-wise/
├── server.js               # Express server setup
├── scraper.js              # Puppeteer scraping logic
├── sentiment.js            # Sentiment analysis module
├── /public                 # Frontend files
│   ├── index.html
│   ├── analysis.html
│   ├── compare.html
│   ├── styles.css
│   ├── script.js
│   ├── analysis.js
│   └── comparision.js
├── data.json               # Scraped product data
├── scrapedData.json        # Review and sentiment data
├── user.json               # Mock user data
├── package.json
├── .gitignore
└── README.md
___

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/scrape-wise.git
   cd scrape-wise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the server:
   ```bash
   npm start
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

 ___
## How It Works

- Users input a product name via the frontend.
- Puppeteer scrapes product listings and reviews from e-commerce sites.
- Sentiment.js analyzes the tone of reviews (positive, neutral, negative).
- Chart.js visualizes price trends and sentiment scores.
- node-cron schedules scraping tasks for fresh data.
- Round-robin proxy rotation ensures scraping remains undetected.
___
## Output
### Home Page
![home_page](https://github.com/user-attachments/assets/68fafaf3-8db2-4a91-aacd-ce41797660c5)
### Home Page in Dark mode
![home_page_dark](https://github.com/user-attachments/assets/b86e17e5-3dcb-41fe-8b8b-2b04e11dcf57)
### Admin Page
![Admin_page](https://github.com/user-attachments/assets/466b85e7-3a3e-48e3-8522-da3690c2c055)
### Login Page
![login_page](https://github.com/user-attachments/assets/eb0b3c57-1ea8-4850-8bc3-7e11fabfba63)
___

## Future Enhancements

-  Multi-platform scraping (Amazon, Flipkart, etc.)
-  AI-powered sentiment analysis using BERT or LSTM
-  User authentication and personalized dashboards
-  API integration with real-time e-commerce feeds
___

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
___

## Acknowledgments

- [Puppeteer](https://pptr.dev/)
- [Sentiment.js](https://github.com/thisandagain/sentiment)
- [Chart.js](https://www.chartjs.org/)
- [node-cron](https://www.npmjs.com/package/node-cron)

___

