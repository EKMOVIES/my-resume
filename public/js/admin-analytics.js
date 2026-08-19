const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let currentPeriod = 30;
let dailyChart = null;

/* =========================================================
   AUTH
========================================================= */

async function getAccessToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/admin.html';
        return null;
    }
    return session.access_token;
}

/* =========================================================
   LOAD ANALYTICS
========================================================= */

async function loadAnalytics(period = 30) {
    const token = await getAccessToken();
    if (!token) return;

    const loading = document.getElementById('loading');
    const content = document.getElementById('dashboardContent');

    try {
        loading.style.display = 'block';
        content.style.display = 'none';

        const response = await fetch(`/api/admin/analytics?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load analytics');
        }

        const data = result.data;
        updateDashboard(data);
        loading.style.display = 'none';
        content.style.display = 'block';

    } catch (error) {
        console.error('Load error:', error);
        loading.innerHTML = `
            <div style="color:#dc2626;font-size:18px;">
                ❌ Error loading analytics: ${error.message}
                <br><br>
                <button onclick="loadAnalytics(${currentPeriod})" 
                        style="padding:10px 20px;background:#005f5f;color:white;border:none;border-radius:6px;cursor:pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard(data) {
    // Update stats
    document.getElementById('totalViews').textContent = data.totalViews || 0;
    document.getElementById('uniqueVisitors').textContent = data.uniqueVisitors || 0;
    document.getElementById('resumeDownloads').textContent = data.resumeDownloads || 0;
    document.getElementById('contactSubmissions').textContent = data.contactSubmissions || 0;

    // Update chart
    updateDailyChart(data.dailyViews || []);

    // Update lists
    updateTopPages(data.topPages || []);
    updateCountries(data.countries || []);
    updateReferrers(data.referrers || []);
    updateProjectClicks(data.projectClicks || []);
    updateBlogViews(data.blogViews || []);
}

/* =========================================================
   DAILY VIEWS CHART
========================================================= */

function updateDailyChart(dailyData) {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    const labels = dailyData.map(item => item.date);
    const views = dailyData.map(item => item.views);

    if (dailyChart) {
        dailyChart.destroy();
    }

    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Page Views',
                data: views,
                borderColor: '#005f5f',
                backgroundColor: 'rgba(0, 95, 95, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#005f5f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/* =========================================================
   UPDATE LISTS
========================================================= */

function updateTopPages(pages) {
    const container = document.getElementById('topPagesList');
    if (!pages || pages.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;padding:10px;">No page data available</p>';
        return;
    }

    const sorted = pages.sort((a, b) => b.count - a.count).slice(0, 10);

    container.innerHTML = sorted.map((item, index) => {
        const colors = ['#005f5f', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];
        const color = colors[index % colors.length];
        const barWidth = Math.min((item.count / sorted[0].count) * 100, 100);
        return `
            <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;">
                    <span>${item.page || '/'}</span>
                    <span style="font-weight:bold;">${item.count}</span>
                </div>
                <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
                    <div style="width:${barWidth}%;height:100%;background:${color};border-radius:3px;transition:width 0.5s;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function updateCountries(countries) {
    const container = document.getElementById('countriesList');
    if (!countries || countries.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;padding:10px;">No country data available</p>';
        return;
    }

    const sorted = countries.sort((a, b) => b.count - a.count).slice(0, 10);

    container.innerHTML = sorted.map((item) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
            <span>${item.country || 'Unknown'}</span>
            <span style="font-weight:bold;color:#005f5f;">${item.count}</span>
        </div>
    `).join('');
}

function updateReferrers(referrers) {
    const container = document.getElementById('referrersList');
    if (!referrers || referrers.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;padding:10px;">No referrer data available</p>';
        return;
    }

    const sorted = referrers.sort((a, b) => b.count - a.count).slice(0, 15);

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Visits</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(item => `
                    <tr>
                        <td>${item.referrer || 'Direct'}</td>
                        <td>${item.count}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateProjectClicks(projects) {
    const container = document.getElementById('projectClicksList');
    if (!projects || projects.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;padding:10px;">No project clicks data available</p>';
        return;
    }

    const sorted = projects.sort((a, b) => b.count - a.count).slice(0, 10);

    container.innerHTML = sorted.map((item) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
            <span>${item.project_title || 'Unknown'}</span>
            <span style="font-weight:bold;color:#005f5f;">${item.count} clicks</span>
        </div>
    `).join('');
}

function updateBlogViews(blogs) {
    const container = document.getElementById('blogViewsList');
    if (!blogs || blogs.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;padding:10px;">No blog view data available</p>';
        return;
    }

    const sorted = blogs.sort((a, b) => b.count - a.count).slice(0, 10);

    container.innerHTML = sorted.map((item) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
            <span>${item.post_title || 'Unknown'}</span>
            <span style="font-weight:bold;color:#005f5f;">${item.count} views</span>
        </div>
    `).join('');
}

/* =========================================================
   PERIOD SELECTOR
========================================================= */

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentPeriod = parseInt(this.dataset.period);
        loadAnalytics(currentPeriod);
    });
});

/* =========================================================
   LOGOUT & BACK
========================================================= */

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin.html';
});

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/admin-dashboard.html';
});

/* =========================================================
   AUTO-REFRESH EVERY 5 MINUTES
========================================================= */

setInterval(() => {
    loadAnalytics(currentPeriod);
}, 5 * 60 * 1000);

/* =========================================================
   INIT
========================================================= */
// Clear test data (for development only)
window.clearTestData = async function() {
    if (!confirm('⚠️ This will delete ALL analytics data. Are you sure?')) return;
    
    const token = await getAccessToken();
    if (!token) return;
    
    try {
        const tables = ['analytics_pageviews', 'analytics_resume_downloads', 
                       'analytics_project_clicks', 'analytics_blog_views', 
                       'analytics_contact_submissions'];
        
        for (const table of tables) {
            await supabaseClient
                .from(table)
                .delete()
                .neq('id', 0);
        }
        
        alert('✅ Test data cleared!');
        loadAnalytics(currentPeriod);
    } catch (error) {
        alert('❌ Error clearing data: ' + error.message);
    }
};


// Update last updated time
function updateLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (el) {
        el.textContent = new Date().toLocaleTimeString();
    }
}

// Call this in loadAnalytics after data loads
// Add this line at the end of loadAnalytics function:
updateLastUpdated();

loadAnalytics(30);