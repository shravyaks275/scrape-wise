document.addEventListener('DOMContentLoaded', () => {
    // Event Listener for Scraping Form Submission
    document.getElementById('scrapeForm').addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        const urls = document.getElementById('urls').value.split(',').map(url => url.trim());

        if (!urls.length) {
            alert('Please enter valid URLs!');
            return;
        }

        try {
            const response = await fetch('/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls })
            });
            const data = await response.json();
            if (!data || !data.data) {
                throw new Error('Invalid response from API');
            }

            // Display JSON Data
            displayJsonData(data.data);

            // Update Sentiment and Sales Charts
            updateSentimentChart(data.data);
            updateSalesChart(data.data);
        } catch (error) {
            console.error('Error fetching analysis data:', error);
            alert('Failed to fetch analysis data.');
        }
    });

    // Display JSON Data
    function displayJsonData(data) {
        document.getElementById('jsonData').textContent = JSON.stringify(data, null, 2);
    }

    // Update Sentiment Chart
    function updateSentimentChart(data) {
        const ctx = document.getElementById('sentimentChart')?.getContext('2d');
        if (!ctx) {
            console.error('Sentiment chart element not found.');
            return;
        }

        // Aggregate sentiment data
        let totalPositive = 0, totalNeutral = 0, totalNegative = 0;
        data.forEach(item => {
            totalPositive += item.sentimentSummary?.positive || 0;
            totalNeutral += item.sentimentSummary?.neutral || 0;
            totalNegative += item.sentimentSummary?.negative || 0;
        });

        // Create or Update Chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    label: 'Sentiment Analysis',
                    data: [totalPositive, totalNeutral, totalNegative],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Update Sales Chart
    function updateSalesChart(data) {
        const ctx = document.getElementById('salesChart')?.getContext('2d');
        if (!ctx) {
            console.error('Sales chart element not found.');
            return;
        }

        const productLabels = data.map((item, index) => `Product ${index + 1}`);
        const estimatedSales = data.map(item => item.estimatedSales || 0);

        // Create or Update Chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: productLabels,
                datasets: [{
                    label: 'Estimated Sales',
                    data: estimatedSales,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dark mode script loaded!'); // Debugging log

    const darkModeButton = document.getElementById('darkModeToggle');
    if (!darkModeButton) {
        console.error('Dark Mode button not found!');
        return;
    }

    darkModeButton.addEventListener('click', () => {
        console.log('Dark mode button clicked!'); // Debugging log
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Restore Dark Mode on Page Load
    window.addEventListener('load', () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) document.body.classList.add('dark-mode');
    });
});
