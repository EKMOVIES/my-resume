const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let editingId = null;
const form = document.getElementById('testimonialsForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const list = document.getElementById('testimonialsList');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => {
        message.className = 'message';
    }, 5000);
}

function getFormData() {
    return {
        name: document.getElementById('name').value.trim(),
        position: document.getElementById('position').value.trim(),
        company: document.getElementById('company').value.trim(),
        avatar_url: document.getElementById('avatar_url').value.trim(),
        rating: parseInt(document.getElementById('rating').value) || 5,
        message: document.getElementById('message').value.trim(),
        is_approved: document.getElementById('is_approved').checked,
        sort_order: parseInt(document.getElementById('sort_order').value) || 0
    };
}

function fillForm(data) {
    document.getElementById('name').value = data.name || '';
    document.getElementById('position').value = data.position || '';
    document.getElementById('company').value = data.company || '';
    document.getElementById('avatar_url').value = data.avatar_url || '';
    document.getElementById('rating').value = data.rating || 5;
    document.getElementById('message').value = data.message || '';
    document.getElementById('is_approved').checked = data.is_approved !== false;
    document.getElementById('sort_order').value = data.sort_order || 0;
}

function resetForm() {
    form.reset();
    document.getElementById('is_approved').checked = true;
    document.getElementById('rating').value = 5;
    editingId = null;
    formTitle.textContent = 'Add New Testimonial';
    cancelBtn.style.display = 'none';
}

async function getAccessToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/admin.html';
        return null;
    }
    return session.access_token;
}

function renderStars(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

async function loadTestimonials() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        loading.style.display = 'block';
        loading.textContent = 'Loading testimonials...';

        const response = await fetch('/api/admin/testimonials', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load testimonials.');
        }

        renderList(result.data || []);
        loading.style.display = 'none';
    } catch (error) {
        console.error('Load error:', error);
        loading.textContent = '❌ Error: ' + error.message;
        showMessage(error.message, 'error');
    }
}

function renderList(items) {
    if (items.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:40px;color:#6b7280;">
                <p style="font-size:18px;">📝 No testimonials added yet.</p>
                <p>Add your first testimonial using the form above.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-content">
                ${item.avatar_url ? 
                    `<img src="${item.avatar_url}" alt="${item.name}" class="avatar" onerror="this.style.display='none'">` : 
                    `<div style="width:50px;height:50px;border-radius:50%;background:#005f5f;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;margin-bottom:10px;">${item.name.charAt(0)}</div>`
                }
                <h3>${item.name}</h3>
                <div class="position">${item.position || ''} ${item.company ? 'at ' + item.company : ''}</div>
                <div class="stars">${renderStars(item.rating)}</div>
                <div class="message-text">"${item.message}"</div>
                <div style="margin-top:8px;">
                    <span class="badge ${item.is_approved ? 'approved' : 'pending'}">
                        ${item.is_approved ? '✅ Approved' : '⏳ Pending'}
                    </span>
                </div>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editItem(${item.id})">✏️ Edit</button>
                ${!item.is_approved ? `<button class="approve-btn" onclick="approveItem(${item.id})">✅ Approve</button>` : ''}
                <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

window.editItem = async function(id) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/admin/testimonials', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        if (!response.ok) throw new Error('Could not fetch item data');

        const item = result.data.find(i => i.id === id);
        if (!item) throw new Error('Item not found');

        fillForm(item);
        editingId = id;
        formTitle.textContent = '✏️ Edit Testimonial';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Edit error:', error);
        showMessage(error.message, 'error');
    }
};

window.approveItem = async function(id) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/testimonials/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_approved: true })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not approve.');
        }

        showMessage('✅ Testimonial approved successfully.', 'success');
        loadTestimonials();
    } catch (error) {
        console.error('Approve error:', error);
        showMessage(error.message, 'error');
    }
};

window.deleteItem = async function(id) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/testimonials/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        showMessage('🗑️ Testimonial deleted successfully.', 'success');
        loadTestimonials();
    } catch (error) {
        console.error('Delete error:', error);
        showMessage(error.message, 'error');
    }
};

// Form Submit
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const formData = getFormData();

    // Validation
    if (!formData.name || !formData.message) {
        showMessage('⚠️ Name and message are required.', 'error');
        return;
    }

    const url = editingId ? `/api/admin/testimonials/${editingId}` : '/api/admin/testimonials';
    const method = editingId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Could not save.');
        }

        showMessage(
            editingId ? '✅ Testimonial updated successfully.' : '✅ Testimonial added successfully.',
            'success'
        );

        resetForm();
        loadTestimonials();
    } catch (error) {
        console.error('Save error:', error);
        showMessage('❌ ' + error.message, 'error');
    }
});

// Cancel Button
cancelBtn.addEventListener('click', resetForm);
cancelBtn.style.display = 'none';

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin.html';
});

// Back to Dashboard
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/admin-dashboard.html';
});

// Load testimonials on page load
loadTestimonials();