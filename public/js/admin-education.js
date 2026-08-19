const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let editingId = null;
const form = document.getElementById('educationForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const list = document.getElementById('educationList');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => { message.className = 'message'; }, 5000);
}

function getFormData() {
    return {
        institution: document.getElementById('institution').value.trim(),
        degree: document.getElementById('degree').value.trim(),
        start_year: document.getElementById('start_year').value || null,
        end_year: document.getElementById('end_year').value || null,
        description: document.getElementById('description').value.trim(),
        sort_order: parseInt(document.getElementById('sort_order').value) || 0
    };
}

function fillForm(data) {
    document.getElementById('institution').value = data.institution || '';
    document.getElementById('degree').value = data.degree || '';
    document.getElementById('start_year').value = data.start_year || '';
    document.getElementById('end_year').value = data.end_year || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('sort_order').value = data.sort_order || 0;
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = 'Add New Education';
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

async function loadEducation() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/education', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load education.');
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
        list.innerHTML = '<p style="color:#6b7280;">No education added yet.</p>';
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-content">
                <h3>${item.institution}</h3>
                <p><strong>${item.degree}</strong></p>
                <p style="font-size:13px;color:#6b7280;">
                    ${item.start_year || ''} ${item.end_year ? '- ' + item.end_year : ''}
                </p>
                ${item.description ? `<p style="font-size:14px;margin-top:5px;">${item.description}</p>` : ''}
            </div>
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
        const response = await fetch('/api/education', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok) throw new Error('Could not fetch item data');

        const item = result.data.find(i => i.id === id);
        if (!item) throw new Error('Item not found');

        fillForm(item);
        editingId = id;
        formTitle.textContent = 'Edit Education';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showMessage(error.message, 'error');
    }
};

window.deleteItem = async function(id) {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/education/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        showMessage('Education deleted successfully.', 'success');
        loadEducation();
    } catch (error) {
        showMessage(error.message, 'error');
    }
};

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const formData = getFormData();
    const url = editingId ? `/api/education/${editingId}` : '/api/education';
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
            editingId ? 'Education updated successfully.' : 'Education added successfully.',
            'success'
        );

        resetForm();
        loadEducation();
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

loadEducation();