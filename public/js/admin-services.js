const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let editingId = null;
const form = document.getElementById('servicesForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const list = document.getElementById('servicesList');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => { message.className = 'message'; }, 5000);
}

function getFormData() {
    return {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        icon: document.getElementById('icon').value.trim(),
        sort_order: parseInt(document.getElementById('sort_order').value) || 0
    };
}

function fillForm(data) {
    document.getElementById('title').value = data.title || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('icon').value = data.icon || '';
    document.getElementById('sort_order').value = data.sort_order || 0;
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = 'Add New Service';
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

async function loadServices() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/services', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load services.');
        }

        renderList(result.data || []);
        loading.style.display = 'none';
    } catch (error) {
        loading.textContent = error.message;
        showMessage(error.message, 'error');
    }
}

function renderList(items) {
    if (items.length === 0) {
        list.innerHTML = '<p style="color:#6b7280;">No services added yet.</p>';
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="item-card">
            ${item.icon ? `<div class="icon">${item.icon}</div>` : ''}
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="item-actions">
                <button class="edit-btn" onclick="editItem(${item.id})">Edit</button>
                <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

window.editItem = async function(id) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/services', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok) throw new Error('Could not fetch item data');

        const item = result.data.find(i => i.id === id);
        if (!item) throw new Error('Item not found');

        fillForm(item);
        editingId = id;
        formTitle.textContent = 'Edit Service';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showMessage(error.message, 'error');
    }
};

window.deleteItem = async function(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/services/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        showMessage('Service deleted successfully.', 'success');
        loadServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
};

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const formData = getFormData();
    const url = editingId ? `/api/services/${editingId}` : '/api/services';
    const method = editingId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Could not save.');
        }

        showMessage(
            editingId ? 'Service updated successfully.' : 'Service added successfully.',
            'success'
        );

        resetForm();
        loadServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

cancelBtn.addEventListener('click', resetForm);
cancelBtn.style.display = 'none';

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin.html';
});

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/admin-dashboard.html';
});

loadServices();