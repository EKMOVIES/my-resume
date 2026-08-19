const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let editingId = null;
const form = document.getElementById('blogForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const list = document.getElementById('postsList');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => {
        message.className = 'message';
    }, 5000);
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getFormData() {
    return {
        title: document.getElementById('title').value.trim(),
        slug: document.getElementById('slug').value.trim() || slugify(document.getElementById('title').value.trim()),
        excerpt: document.getElementById('excerpt').value.trim(),
        content: document.getElementById('content').value.trim(),
        cover_image: document.getElementById('cover_image').value.trim(),
        category: document.getElementById('category').value.trim(),
        tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
        is_published: document.getElementById('is_published').checked
    };
}

function fillForm(data) {
    document.getElementById('title').value = data.title || '';
    document.getElementById('slug').value = data.slug || '';
    document.getElementById('excerpt').value = data.excerpt || '';
    document.getElementById('content').value = data.content || '';
    document.getElementById('cover_image').value = data.cover_image || '';
    document.getElementById('category').value = data.category || '';
    document.getElementById('tags').value = (data.tags || []).join(', ');
    document.getElementById('is_published').checked = data.is_published || false;
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = 'Create New Post';
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

async function loadPosts() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        loading.style.display = 'block';
        loading.textContent = 'Loading posts...';

        const response = await fetch('/api/admin/blog', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load posts.');
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
                <p style="font-size:18px;">📝 No blog posts yet.</p>
                <p>Create your first post using the form above.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-content">
                <h3>${item.title}</h3>
                <div class="meta">
                    <span>📅 ${new Date(item.created_at).toLocaleDateString()}</span>
                    ${item.category ? ` | 📂 ${item.category}` : ''}
                    ${item.tags && item.tags.length ? ` | 🏷️ ${item.tags.join(', ')}` : ''}
                    ${item.views ? ` | 👁️ ${item.views} views` : ''}
                    <span class="badge ${item.is_published ? 'published' : 'draft'}" style="margin-left:10px;">
                        ${item.is_published ? '✅ Published' : '📝 Draft'}
                    </span>
                </div>
                <p style="margin-top:8px;color:#6b7280;">${item.excerpt || item.content.substring(0, 150) + '...'}</p>
            </div>
            <div class="item-actions">
                ${item.is_published ? `<a href="/blog/${item.slug}" target="_blank" class="view-btn">👁️ View</a>` : ''}
                <button class="edit-btn" onclick="editItem(${item.id})">✏️ Edit</button>
                <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

window.editItem = async function(id) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/admin/blog', {
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
        formTitle.textContent = '✏️ Edit Post';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Edit error:', error);
        showMessage(error.message, 'error');
    }
};

window.deleteItem = async function(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/blog/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        showMessage('🗑️ Post deleted successfully.', 'success');
        loadPosts();
    } catch (error) {
        console.error('Delete error:', error);
        showMessage(error.message, 'error');
    }
};

// Auto-generate slug from title
document.getElementById('title').addEventListener('blur', function() {
    const slugInput = document.getElementById('slug');
    if (!slugInput.value) {
        slugInput.value = slugify(this.value);
    }
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const formData = getFormData();

    // Validation
    if (!formData.title || !formData.slug || !formData.content) {
        showMessage('⚠️ Title, slug and content are required.', 'error');
        return;
    }

    const url = editingId ? `/api/admin/blog/${editingId}` : '/api/admin/blog';
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
            editingId ? '✅ Post updated successfully.' : '✅ Post created successfully.',
            'success'
        );

        resetForm();
        loadPosts();
    } catch (error) {
        console.error('Save error:', error);
        showMessage('❌ ' + error.message, 'error');
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

loadPosts();