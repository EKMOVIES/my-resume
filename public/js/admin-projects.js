const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/* =========================================================
   CLOUDINARY CONFIGURATION
========================================================= */

const CLOUD_NAME = "estyakproject";
const UPLOAD_PRESET = "resume_projects";

/* =========================================================
   VARIABLES
========================================================= */

let editingId = null;
const form = document.getElementById('projectsForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const list = document.getElementById('projectsList');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');

/* =========================================================
   IMAGE UPLOAD FUNCTIONS
========================================================= */

// Cloudinary এ Image Upload
async function uploadImageToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);

    const status = document.getElementById('uploadStatus');
    status.textContent = '⏳ Uploading...';
    status.style.color = '#2563eb';

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Upload failed');
        }

        status.textContent = '✅ Upload successful!';
        status.style.color = '#16a34a';

        return data.secure_url;

    } catch (error) {
        console.error('Upload error:', error);
        status.textContent = '❌ ' + error.message;
        status.style.color = '#dc2626';
        return null;
    }
}

// Image Preview Show
function showImagePreview(url) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;

    if (url) {
        preview.innerHTML = `
            <img src="${url}" alt="Project Image">
            <button type="button" onclick="removeImage()">✕ Remove</button>
        `;
        preview.style.display = 'block';
    } else {
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
}

// Image Remove
window.removeImage = function() {
    document.getElementById('image_url').value = '';
    document.getElementById('imageUpload').value = '';
    showImagePreview('');
    document.getElementById('uploadStatus').textContent = '';
};

/* =========================================================
   FORM FUNCTIONS
========================================================= */

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => {
        message.className = 'message';
    }, 5000);
}

function getFormData() {
    return {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        image_url: document.getElementById('image_url').value.trim(),  // ✅ এইটা আছে নিশ্চিত করো
        technologies: document.getElementById('technologies').value.trim(),
        live_url: document.getElementById('live_url').value.trim(),
        github_url: document.getElementById('github_url').value.trim(),
        sort_order: parseInt(document.getElementById('sort_order').value) || 0
    };
}
function fillForm(data) {
    document.getElementById('title').value = data.title || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('image_url').value = data.image_url || '';
    document.getElementById('technologies').value = data.technologies || '';
    document.getElementById('live_url').value = data.live_url || '';
    document.getElementById('github_url').value = data.github_url || '';
    document.getElementById('sort_order').value = data.sort_order || 0;
    
    if (data.image_url) {
        showImagePreview(data.image_url);
    }
}

function resetForm() {
    form.reset();
    document.getElementById('image_url').value = '';
    document.getElementById('imageUpload').value = '';
    showImagePreview('');
    document.getElementById('uploadStatus').textContent = '';
    editingId = null;
    formTitle.textContent = 'Add New Project';
    cancelBtn.style.display = 'none';
}

/* =========================================================
   AUTH & API FUNCTIONS
========================================================= */

async function getAccessToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/admin.html';
        return null;
    }
    return session.access_token;
}

async function loadProjects() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        loading.style.display = 'block';
        loading.textContent = 'Loading projects...';

        const response = await fetch('/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load projects.');
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
            <div style="text-align:center;padding:40px;color:#6b7280;grid-column:1/-1;">
                <p style="font-size:18px;">📁 No projects added yet.</p>
                <p>Add your first project using the form above.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="item-card">
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="project-image" onerror="this.style.display='none'">` : ''}
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            ${item.technologies ? `<div>${item.technologies.split(',').map(t => `<span class="tech">${t.trim()}</span>`).join('')}</div>` : ''}
            <div class="links">
                ${item.live_url ? `<a href="${item.live_url}" target="_blank">🔗 Live</a>` : ''}
                ${item.github_url ? `<a href="${item.github_url}" target="_blank">💻 GitHub</a>` : ''}
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editItem(${item.id})">✏️ Edit</button>
                <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

/* =========================================================
   IMAGE UPLOAD EVENT LISTENER
========================================================= */

const imageUpload = document.getElementById('imageUpload');
if (imageUpload) {
    imageUpload.addEventListener('change', async function(e) {
        const file = this.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            document.getElementById('uploadStatus').textContent = '❌ Please select an image file.';
            document.getElementById('uploadStatus').style.color = '#dc2626';
            this.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            document.getElementById('uploadStatus').textContent = '❌ Image size must be less than 5MB.';
            document.getElementById('uploadStatus').style.color = '#dc2626';
            this.value = '';
            return;
        }

        const imageUrl = await uploadImageToCloudinary(file);

        if (imageUrl) {
            document.getElementById('image_url').value = imageUrl;
            showImagePreview(imageUrl);
        }

        this.value = '';
    });
}

// Image URL input change - show preview
const imageUrlInput = document.getElementById('image_url');
if (imageUrlInput) {
    imageUrlInput.addEventListener('input', function() {
        const url = this.value.trim();
        if (url) {
            showImagePreview(url);
        } else {
            showImagePreview('');
        }
    });
}

/* =========================================================
   CRUD OPERATIONS
========================================================= */

window.editItem = async function(id) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/projects', {
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
        formTitle.textContent = '✏️ Edit Project';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Edit error:', error);
        showMessage(error.message, 'error');
    }
};

window.deleteItem = async function(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        showMessage('🗑️ Project deleted successfully.', 'success');
        loadProjects();
    } catch (error) {
        console.error('Delete error:', error);
        showMessage(error.message, 'error');
    }
};

/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const formData = getFormData();

    // Validation
    if (!formData.title || !formData.description) {
        showMessage('⚠️ Title and description are required.', 'error');
        return;
    }

    const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
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
            editingId ? '✅ Project updated successfully.' : '✅ Project added successfully.',
            'success'
        );

        resetForm();
        loadProjects();
    } catch (error) {
        console.error('Save error:', error);
        showMessage('❌ ' + error.message, 'error');
    }
});

/* =========================================================
   CANCEL, LOGOUT, BACK
========================================================= */

cancelBtn.addEventListener('click', resetForm);
cancelBtn.style.display = 'none';

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin.html';
});

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/admin-dashboard.html';
});

loadProjects();