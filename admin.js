document.addEventListener('DOMContentLoaded', () => {
    const embedUrl = "YOUR_EMBED_URL";
    const reportContainer = document.getElementById("powerBIContainer");

    if (!reportContainer) {
        console.error('Power BI container not found!');
        return;
    }

    const config = {
        type: "report",
        tokenType: 0,
        accessToken: "YOUR_ACCESS_TOKEN",
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin dashboard loaded!');

    // Dark Mode Toggle
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    window.addEventListener('load', () => {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    });

    // View Users
    document.getElementById('viewUsers').addEventListener('click', () => {
        fetch('/admin/users')
            .then(response => response.json())
            .then(data => {
                const userList = document.getElementById('userList');
                userList.innerHTML = `<ul>${data.users.map(user => `<li>${user.username} - ${user.role}</li>`).join('')}</ul>`;
            })
            .catch(error => console.error('Error fetching users:', error));
    });

    // Block User
    document.getElementById('blockUser').addEventListener('click', () => {
        const userId = prompt('Enter the user ID to block:');
        fetch('/admin/block-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        }).then(response => response.json())
          .then(data => alert(data.message));
    });

    // View Scraping Logs
    document.getElementById('viewLogs').addEventListener('click', () => {
        fetch('/admin/scraping-logs')
            .then(response => response.json())
            .then(data => {
                document.getElementById('logs').textContent = JSON.stringify(data.logs, null, 2);
            })
            .catch(error => console.error('Error fetching logs:', error));
    });

    // Check Server Health
    document.getElementById('checkServer').addEventListener('click', () => {
        fetch('/admin/server-status')
            .then(response => response.json())
            .then(data => {
                document.getElementById('serverStatus').textContent = `Server Status: ${data.status}`;
            })
            .catch(error => console.error('Error checking server:', error));
    });
});
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).send({ error: "Invalid credentials" });
    }

    res.status(200).send({ message: `Welcome, ${username}!`, role: user.role });
});
app.post('/scrape', async (req, res) => {
    const { username, urls } = req.body;

    if (!username || !Array.isArray(urls)) {
        return res.status(400).send({ error: "Username and valid URLs required" });
    }

    try {
        const scrapedData = await Promise.all(urls.map(scrapeWebsite));

        // Store logs by username
        if (!scrapingLogs[username]) {
            scrapingLogs[username] = [];
        }
        scrapingLogs[username].push({ timestamp: new Date(), data: scrapedData });

        res.status(200).send({ message: "Scraping successful", data: scrapedData });
    } catch (error) {
        console.error("Scraping Error:", error);
        res.status(500).send({ error: "Scraping failed." });
    }
});
app.get('/admin/user-logs', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).send({ error: "Username is required" });
    }

    const logs = scrapingLogs[username] || [];
    res.status(200).send({ message: `Logs for ${username}`, logs });
});
document.getElementById('viewLogs').addEventListener('click', () => {
    fetch('/admin/scraping-logs')
        .then(response => response.json())
        .then(data => {
            const logsContainer = document.getElementById('logs');
            logsContainer.innerHTML = '<h2>Scraping Logs</h2>';
            
            data.logs && Object.entries(data.logs).forEach(([user, logs]) => {
                logsContainer.innerHTML += `<h3>User: ${user}</h3>`;
                logs.forEach(log => {
                    logsContainer.innerHTML += `
                        <p><strong>Timestamp:</strong> ${log.timestamp}</p>
                        <p><strong>URLs Scraped:</strong> ${log.urls.join(', ')}</p>
                        <p><strong>Status:</strong> ${log.status}</p>
                        ${log.data ? `<p><strong>Extracted Data:</strong> ${JSON.stringify(log.data)}</p>` : ""}
                        ${log.error ? `<p style="color:red"><strong>Error:</strong> ${log.error}</p>` : ""}
                        <hr>
                    `;
                });
            });
        })
        .catch(error => console.error('Error fetching logs:', error));
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