// ============================================================
// 🔔 ADMIN NOTIFICATION WIDGET - FIXED
// ============================================================

class AdminNotificationWidget {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isOpen = false;
        this.token = null;
        this.supabase = null;
        this.init();
    }

    async init() {
        // ✅ Initialize Supabase client if not already
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            if (!window._supabaseClient) {
                const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
                const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';
                window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
            }
            this.supabase = window._supabaseClient;
        } else {
            console.warn('⚠️ Supabase not loaded, retrying...');
            setTimeout(() => this.init(), 1000);
            return;
        }

        await this.loadNotifications();
        this.createUI();
        this.startAutoRefresh();
    }

    async getToken() {
        if (!this.supabase) {
            console.warn('⚠️ Supabase not initialized');
            return null;
        }

        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) {
                console.error('Session error:', error);
                return null;
            }
            if (!session) {
                console.warn('⚠️ No session found');
                return null;
            }
            this.token = session.access_token;
            return this.token;
        } catch (error) {
            console.error('Get token error:', error);
            return null;
        }
    }

    async loadNotifications() {
        const token = await this.getToken();
        if (!token) {
            console.warn('⚠️ No token, skipping notification load');
            return;
        }

        try {
            const response = await fetch('/api/admin/notifications?limit=20', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                this.notifications = result.data || [];
                this.unreadCount = result.unread_count || 0;
                this.updateUI();
            }
        } catch (error) {
            console.error('Load notifications error:', error);
        }
    }

    createUI() {
        // ✅ Create notification bell
        const bell = document.createElement('div');
        bell.id = 'adminNotificationBell';
        bell.innerHTML = `
            <button class="notif-bell" onclick="window.notifWidget?.toggle()">
                🔔
                <span class="notif-badge" id="notifBadge">0</span>
            </button>
            <div class="notif-dropdown" id="notifDropdown">
                <div class="notif-header">
                    <span>Notifications</span>
                    <button onclick="window.notifWidget?.markAllRead()">Mark all read</button>
                </div>
                <div class="notif-list" id="notifList">
                    <div style="text-align:center;padding:20px;color:#6b7280;">Loading...</div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #adminNotificationBell {
                position: relative;
                display: inline-block;
            }
            .notif-bell {
                background: transparent;
                border: none;
                font-size: 24px;
                cursor: pointer;
                position: relative;
                padding: 5px 10px;
                border-radius: 8px;
                transition: all 0.3s;
                color: white;
            }
            .notif-bell:hover {
                background: rgba(255,255,255,0.1);
            }
            .notif-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                padding: 1px 7px;
                font-size: 11px;
                font-weight: 700;
                min-width: 20px;
                text-align: center;
            }
            .notif-dropdown {
                display: none;
                position: absolute;
                right: 0;
                top: 45px;
                width: 380px;
                max-height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                border: 1px solid #e5e7eb;
                overflow: hidden;
                z-index: 9999;
            }
            .notif-dropdown.open {
                display: block;
            }
            .notif-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #e5e7eb;
                background: #f8fafc;
            }
            .notif-header span {
                font-weight: 700;
                font-size: 16px;
                color: #1f2937;
            }
            .notif-header button {
                background: none;
                border: none;
                color: #005f5f;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
            }
            .notif-header button:hover {
                text-decoration: underline;
            }
            .notif-list {
                max-height: 420px;
                overflow-y: auto;
            }
            .notif-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: all 0.2s;
            }
            .notif-item:hover {
                background: #f8fafc;
            }
            .notif-item.unread {
                background: #f0f7ff;
            }
            .notif-item .notif-icon {
                font-size: 24px;
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: #f3f4f6;
            }
            .notif-item .notif-content {
                flex: 1;
                min-width: 0;
            }
            .notif-item .notif-title {
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
            }
            .notif-item .notif-message {
                font-size: 13px;
                color: #6b7280;
                margin-top: 2px;
                word-wrap: break-word;
            }
            .notif-item .notif-time {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 4px;
            }
            .notif-item .notif-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #005f5f;
                flex-shrink: 0;
                margin-top: 6px;
            }
            .notif-empty {
                text-align: center;
                padding: 40px 20px;
                color: #6b7280;
            }
            .notif-empty .icon {
                font-size: 40px;
                margin-bottom: 10px;
            }

            @media (max-width: 480px) {
                .notif-dropdown {
                    right: -60px;
                    width: calc(100vw - 20px);
                    max-width: 380px;
                }
            }
        `;

        document.head.appendChild(style);
        
        // Find navbar user-info
        const userInfo = document.querySelector('.navbar .user-info');
        if (userInfo) {
            userInfo.appendChild(bell);
        } else {
            // Fallback: add to navbar
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const container = document.createElement('div');
                container.className = 'user-info';
                container.style.cssText = 'display:flex;align-items:center;gap:15px;';
                navbar.appendChild(container);
                container.appendChild(bell);
            }
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#adminNotificationBell')) {
                this.close();
            }
        });

        this.updateUI();
    }

    updateUI() {
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            badge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
        }
        this.renderNotifications();
    }

    renderNotifications() {
        const list = document.getElementById('notifList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="notif-empty">
                    <div class="icon">🔔</div>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(n => {
            const isUnread = !n.is_read;
            const time = new Date(n.created_at).toLocaleString();
            const icon = n.icon || '📌';
            const color = n.color || '#005f5f';

            return `
                <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="window.notifWidget?.markRead('${n.id}')">
                    <div class="notif-icon" style="background:${color}20;color:${color};">${icon}</div>
                    <div class="notif-content">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-message">${n.message}</div>
                        <div class="notif-time">${time}</div>
                    </div>
                    ${isUnread ? `<div class="notif-dot"></div>` : ''}
                </div>
            `;
        }).join('');
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) {
            dropdown.classList.toggle('open', this.isOpen);
        }
        if (this.isOpen) {
            this.loadNotifications();
        }
    }

    close() {
        this.isOpen = false;
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) {
            dropdown.classList.remove('open');
        }
    }

    async markRead(id) {
        const token = await this.getToken();
        if (!token) return;

        try {
            await fetch(`/api/admin/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const notif = this.notifications.find(n => n.id === id);
            if (notif) {
                notif.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateUI();
            }

            if (notif?.link) {
                window.location.href = notif.link;
            }
        } catch (error) {
            console.error('Mark read error:', error);
        }
    }

    async markAllRead() {
        const token = await this.getToken();
        if (!token) return;

        try {
            await fetch('/api/admin/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateUI();
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }
}

// ✅ Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if Supabase is loaded first
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        // Small delay to ensure everything is ready
        setTimeout(() => {
            window.notifWidget = new AdminNotificationWidget();
            console.log('✅ Notification widget initialized');
        }, 500);
    } else {
        console.warn('⚠️ Supabase not loaded, retrying...');
        setTimeout(() => {
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                window.notifWidget = new AdminNotificationWidget();
                console.log('✅ Notification widget initialized (delayed)');
            } else {
                console.error('❌ Supabase failed to load');
            }
        }, 2000);
    }
});

console.log('✅ Admin Notification Widget loaded');