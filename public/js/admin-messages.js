const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loading = document.getElementById('loading');
const list = document.getElementById('messagesList');
const totalEl = document.getElementById('totalMessages');
const unreadEl = document.getElementById('unreadMessages');
const readEl = document.getElementById('readMessages');

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function getAccessToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/admin.html';
        return null;
    }
    return session.access_token;
}

async function loadMessages() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/messages', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load messages.');
        }

        const messages = result.data || [];
        renderList(messages);
        updateStats(messages);
        loading.style.display = 'none';
    } catch (error) {
        loading.textContent = error.message;
        showMessage(error.message, 'error');
    }
}

function updateStats(messages) {
    const total = messages.length;
    const unread = messages.filter(m => !m.is_read).length;
    const read = messages.filter(m => m.is_read).length;

    totalEl.textContent = total;
    unreadEl.textContent = unread;
    readEl.textContent = read;
}

function renderList(messages) {
    if (messages.length === 0) {
        list.innerHTML = `
            <div class="empty">
                <p style="font-size:18px;margin-bottom:8px;">📭 No messages yet</p>
                <p>Messages from your contact form will appear here.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = messages.map(msg => `
        <div class="item-card ${!msg.is_read ? 'unread' : ''}">
            <div class="header">
                <h3>${msg.name}</h3>
                <span class="date">${formatDate(msg.created_at)}</span>
            </div>
            <div class="meta">
                <span>📧 ${msg.email}</span>
                ${msg.subject ? `&nbsp;|&nbsp;📌 ${msg.subject}` : ''}
                &nbsp;|&nbsp;
                <span class="badge ${msg.is_read ? 'read' : 'unread'}">
                    ${msg.is_read ? 'Read' : 'Unread'}
                </span>
            </div>
            <div class="message-text">${msg.message}</div>
            <div class="actions">
                ${!msg.is_read ? `
                    <button class="read-btn" onclick="markAsRead(${msg.id})">Mark as Read</button>
                ` : `
                    <button class="read-btn read" disabled>✓ Read</button>
                `}
                <button class="delete-btn" onclick="deleteMessage(${msg.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// admin-messages.js - markAsRead ফাংশন আপডেট করো

window.markAsRead = async function(id) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/messages/${id}/read`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            }
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error response:', result);
            throw new Error(result.message || 'Could not mark as read.');
        }

        // সফল হলে মেসেজ লিস্ট রিলোড করো
        loadMessages();
        
    } catch (error) {
        console.error('Mark as read error:', error);
        alert('Error: ' + error.message);
    }
};

window.deleteMessage = async function(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        loadMessages();
    } catch (error) {
        alert(error.message);
    }
};

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin.html';
});

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/admin-dashboard.html';
});

loadMessages();