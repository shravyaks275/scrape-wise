// Global Chart Variables to Avoid Conflicts
let sentimentChart;
let salesChart;

// Event Listener for Scraping Form Submission
document.getElementById('scrapeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const urls = document.getElementById('urls').value.split(',').map(url => url.trim());
    const username = "Admin"; // ✅ Hardcoded for testing, replace as needed

    if (!urls.length || !username) {
        alert('Please enter a valid username and URLs!');
        return;
    }

    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, urls }) // ✅ Ensure both are sent
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        localStorage.setItem("scrapedData", JSON.stringify(data.data));
        displayScrapedData(data.data);
        updateSentimentChart(data.data);
        updateSalesChart(data.data);

    } catch (error) {
        console.error('Scraping Error:', error);
        alert(`Error: ${error.message}`);
    }
});

// Display Scraped Data
function displayScrapedData(data) {
    const jsonDataElement = document.getElementById('jsonData');

    if (!jsonDataElement) {
        console.error("Error: Could not find jsonData element.");
        return;
    }

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        jsonDataElement.textContent = "No data available.";
        return;
    }

    jsonDataElement.textContent = JSON.stringify(data, null, 2);
}

// Update Sentiment Chart
function updateSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');

    // Destroy existing chart if it exists
    if (sentimentChart) {
        sentimentChart.destroy();
    }

    // Aggregate sentiment data
    let totalPositive = 0, totalNeutral = 0, totalNegative = 0;
    data.forEach(item => {
        totalPositive += item.sentimentSummary?.positive || 0;
        totalNeutral += item.sentimentSummary?.neutral || 0;
        totalNegative += item.sentimentSummary?.negative || 0;
    });

    // Create the chart
    sentimentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                label: 'Sentiment Analysis',
                data: [totalPositive, totalNeutral, totalNegative],
                backgroundColor: [
                    'rgba(135, 206, 250, 0.8)', // Light blue
                    'rgba(30, 144, 255, 0.8)',  // Dodger blue
                    'rgba(0, 0, 139, 0.8)'      // Dark blue
                ],
                borderColor: [
                    'rgba(135, 206, 250, 1)',
                    'rgba(30, 144, 255, 1)',
                    'rgba(0, 0, 139, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update Sales Chart
function updateSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Destroy existing chart if it exists
    if (salesChart) {
        salesChart.destroy(); // Remove the previous chart instance
    }

    // Dynamically extract product labels and estimated sales for n products
    const productLabels = data.map((item, index) => `Product ${index + 1}`);
    const estimatedSales = data.map(item => item.estimatedSales || 0);

    // Create the chart with dynamic labels
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productLabels, // Dynamic labels based on data size
            datasets: [{
                label: 'Estimated Units Sold',
                data: estimatedSales,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Products' // X-axis title
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Comparison Chart

document.getElementById('comparisonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const url1 = document.getElementById('url1').value.trim();
    const url2 = document.getElementById('url2').value.trim();

    if (!url1 || !url2) {
        alert('Please provide valid URLs for both products.');
        return;
    }

    try {
        const response = await fetch('/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [url1, url2] })
        });

        const comparison = await response.json();
        if (comparison.error) throw new Error(comparison.error);

        displayComparison(comparison.data);
    } catch (error) {
        console.error('Comparison Error:', error);
        alert('An error occurred while fetching the comparison data.');
    }
});

function displayComparison(comparison) {
    const comparisonResult = document.getElementById('comparisonResult');

    // Clear old content
    comparisonResult.innerHTML = '';

    // Check if comparison data is valid
    if (!comparison || !comparison.product1 || !comparison.product2) {
        comparisonResult.innerHTML = '<p>Error: Unable to fetch comparison data.</p>';
        return;
    }

    // Construct the comparison table
    comparisonResult.innerHTML += `
        <h2>Product Comparison</h2>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr>
                    <th style="border-bottom: 2px solid #ccc; padding: 8px;">Parameter</th>
                    <th style="border-bottom: 2px solid #ccc; padding: 8px;">Product 1</th>
                    <th style="border-bottom: 2px solid #ccc; padding: 8px;">Product 2</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">Title</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product1?.title || 'N/A'}</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product2?.title || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">Price</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product1?.price || 'N/A'}</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product2?.price || 'N/A'}</td>
                </tr>
                
                </tr>
                <tr>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">Rating</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product1?.rating || 'N/A'}</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product2?.rating || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">Reviews Count</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product1?.reviewsCount || 'N/A'}</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">${comparison.product2?.reviewsCount || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;">Price Difference</td>
                    <td style="border-bottom: 1px solid #eee; padding: 8px;" colspan="2">
                        ${comparison.priceDifference || 'N/A'}
                    </td>
            </tbody>
        </table>
    `;
}
// Export JSON Data
document.getElementById('exportJson').addEventListener('click', () => {
    const jsonDataElement = document.getElementById('jsonData');

    if (!jsonDataElement || !jsonDataElement.textContent.trim()) {
        alert('No data available for export.');
        return;
    }

    const blob = new Blob([jsonDataElement.textContent], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scraped_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// Export CSV Data
document.getElementById('exportCsv').addEventListener('click', () => {
    const jsonDataElement = document.getElementById('jsonData');

    if (!jsonDataElement || !jsonDataElement.textContent.trim()) {
        alert('No data available for export.');
        return;
    }

    try {
        const data = JSON.parse(jsonDataElement.textContent);
        if (!Array.isArray(data) || data.length === 0) {
            alert('No valid data found for export.');
            return;
        }

        let csv = 'Product Title,Price,Positive Reviews,Neutral Reviews,Negative Reviews,Estimated Sales\n';
        data.forEach(item => {
            const positive = item.sentimentSummary?.positive || 0;
            const neutral = item.sentimentSummary?.neutral || 0;
            const negative = item.sentimentSummary?.negative || 0;
            const estimatedSales = item.estimatedSales || 0;

            csv += `"${item.productTitle}","${item.price}",${positive},${neutral},${negative},${estimatedSales}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'scraped_data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('An error occurred while exporting CSV. Please try again.');
    }
});

// Dark Mode Toggle
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
document.addEventListener('DOMContentLoaded', () => {
    const embedUrl = "YOUR_EMBED_URL";
    const accessToken = "YOUR_ACCESS_TOKEN"; 
    const reportContainer = document.getElementById("powerBIContainer");

    if (!reportContainer) {
        console.error('Power BI container not found!');
        return;
    }

    const config = {
        type: "report",
        tokenType: 0,
        accessToken: accessToken,
        embedUrl: embedUrl,
        id: "YOUR_REPORT_ID",
        settings: {
            filterPaneEnabled: false,
            navContentPaneEnabled: true
        }
    };

    const powerbi = new window.powerbi.Service(window.powerbi.factories.default);
    powerbi.embed(reportContainer, config);
});

// script.js

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('log');
    const loginDialog = document.getElementById('loginDialog');
    const cancelButton = document.getElementById('cancelButton');

    // Show the login dialog when the login button is clicked
    loginButton.addEventListener('click', () => {
        loginDialog.showModal();
    });

    // Close the dialog when the cancel button is clicked
    cancelButton.addEventListener('click', () => {
        loginDialog.close();
    });

    // Optional: Handle form submission
    const loginForm = loginDialog.querySelector('form');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Send login request to the server
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();
        const loginMessage = document.getElementById('loginMessage');

        if (response.ok) {
            loginMessage.style.color = 'green';
            loginMessage.textContent = result.message;
            // Optionally redirect or update UI after successful login
        } else {
            loginMessage.style.color = 'red';
            loginMessage.textContent = result.message;
        }
    });
});
document.getElementById('downloadLogs').addEventListener('click', () => {
    window.location.href = '/admin/download-logs';
});
window.addEventListener('DOMContentLoaded', () => {
    const storedData = localStorage.getItem("scrapedData");
    if (storedData) {
        displayScrapedData(JSON.parse(storedData));
        updateSentimentChart(JSON.parse(storedData));
        updateSalesChart(JSON.parse(storedData));
    }
});
function getCookie(name) {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    for (let cookie of cookies) {
        if (cookie.startsWith(name + '=')) {
            return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        }
    }
    return null;
}

window.addEventListener('DOMContentLoaded', () => {
    const storedData = getCookie("scrapedData");
    if (storedData) {
        displayScrapedData(storedData);
        updateSentimentChart(storedData);
        updateSalesChart(storedData);
    }
});
window.addEventListener('DOMContentLoaded', () => {
    const cookiePopup = document.getElementById('cookiePopup');
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');

    // ✅ Show popup if consent isn't set
    if (!localStorage.getItem('cookieConsent')) {
        cookiePopup.style.display = 'block';
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookiePopup.style.display = 'none';
    });

    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'rejected');
        cookiePopup.style.display = 'none';
    });
});
document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('cookiePopup').style.display = 'none';
});
window.onload = function() {
    document.getElementById('messageBox').style.display = 'block';
};

document.getElementById('closeMessage').addEventListener('click', function() {
    document.getElementById('messageBox').style.display = 'none';
});
window.onload = function() {
    alert("Welcome to SCRAPE WISE! This website enhances user experience with cookies.");
};
