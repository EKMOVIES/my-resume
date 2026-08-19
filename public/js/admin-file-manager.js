const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/* =========================================================
   VARIABLES
========================================================= */

const form = document.getElementById('fileForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const list = document.getElementById('filesList');
const fileInput = document.getElementById('fileUpload');
const fileNameDisplay = document.getElementById('fileNameDisplay');

/* =========================================================
   FUNCTIONS
========================================================= */

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => {
        message.className = 'message';
    }, 5000);
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get File Type Icon
function getFileIcon(fileType, fileUrl) {
    if (!fileUrl) return '📄';
    const url = fileUrl.toLowerCase();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return '🖼️';
    if (url.match(/\.(pdf)$/)) return '📕';
    if (url.match(/\.(doc|docx)$/)) return '📘';
    if (url.match(/\.(xls|xlsx)$/)) return '📊';
    if (url.match(/\.(ppt|pptx)$/)) return '📙';
    if (url.match(/\.(zip|rar|7z)$/)) return '📦';
    if (url.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/)) return '🎬';
    if (url.match(/\.(mp3|wav|wma|aac)$/)) return '🎵';
    if (url.match(/\.(txt|log)$/)) return '📝';
    if (url.match(/\.(json|xml|yaml|yml)$/)) return '⚙️';
    if (url.match(/\.(js|ts|jsx|tsx|html|css|scss|php|py|java|cpp|c|go|rb|swift)$/)) return '💻';
    return '📄';
}

async function getAccessToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/admin.html';
        return null;
    }
    return session.access_token;
}

async function loadFiles() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        loading.style.display = 'block';
        loading.textContent = 'Loading files...';

        const response = await fetch('/api/admin/files', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load files.');
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
                <p style="font-size:48px;margin-bottom:10px;">📁</p>
                <p style="font-size:18px;">No files uploaded yet</p>
                <p>Upload your first file using the form above.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(item => {
        const isPDF = item.file_url && item.file_url.toLowerCase().includes('.pdf');
        const isImage = item.file_url && item.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i);
        const fileUrl = item.file_url.startsWith('/uploads/') ? item.file_url : item.file_url;
        
        return `
            <div class="item-card">
                <div class="file-icon">${getFileIcon(item.file_type, item.file_url)}</div>
                <div class="file-name">${item.file_name}</div>
                <div class="file-meta">
                    ${item.category || 'Uncategorized'} • ${formatFileSize(item.file_size || 0)}
                </div>
                ${item.description ? `<div class="file-meta" style="margin-top:5px;">${item.description}</div>` : ''}
                <div class="file-actions">
                    ${isImage ? `<a href="${fileUrl}" target="_blank" class="download-btn">👁️ View</a>` : ''}
                    ${isPDF ? `<a href="${fileUrl}" target="_blank" class="download-btn">📄 View PDF</a>` : ''}
                    ${!isImage && !isPDF ? `<a href="${fileUrl}" target="_blank" class="download-btn">👁️ View</a>` : ''}
                    <a href="${fileUrl}" download="${item.file_name}" class="download-btn" style="background:#16a34a;">⬇️ Download</a>
                    <button class="delete-btn" onclick="deleteFile(${item.id}, '${fileUrl}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// ✅ Delete File (Server + Database)
window.deleteFile = async function(id, fileUrl) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/delete-server-file/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not delete.');
        }

        showMessage('🗑️ File deleted successfully.', 'success');
        loadFiles();
    } catch (error) {
        console.error('Delete error:', error);
        showMessage(error.message, 'error');
    }
};

/* =========================================================
   FILE INPUT HANDLING
========================================================= */

fileInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (!file) {
        fileNameDisplay.textContent = 'No file selected';
        return;
    }

    fileNameDisplay.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
    
    const nameInput = document.getElementById('file_name');
    if (!nameInput.value) {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        nameInput.value = baseName;
    }

    const preview = document.getElementById('filePreview');
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <div class="file-info">${file.name} (${formatFileSize(file.size)})</div>
            `;
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        preview.innerHTML = `
            <div class="file-info" style="padding:20px;background:#f3f4f6;border-radius:8px;text-align:center;">
                <div style="font-size:48px;">📕</div>
                <div>${file.name}</div>
                <div style="font-size:13px;color:#6b7280;">${formatFileSize(file.size)}</div>
                <div style="font-size:12px;color:#16a34a;margin-top:5px;">✅ PDF file ready to upload</div>
            </div>
        `;
    } else {
        preview.innerHTML = `
            <div class="file-info" style="padding:20px;background:#f3f4f6;border-radius:8px;text-align:center;">
                <div style="font-size:48px;">${getFileIcon('', file.name)}</div>
                <div>${file.name}</div>
                <div style="font-size:13px;color:#6b7280;">${formatFileSize(file.size)}</div>
            </div>
        `;
    }
});

/* =========================================================
   FORM SUBMIT - Server Upload (No Cloudinary)
========================================================= */

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const file = fileInput.files[0];
    if (!file) {
        showMessage('⚠️ Please select a file to upload.', 'error');
        return;
    }

    const file_name = document.getElementById('file_name').value.trim();
    if (!file_name) {
        showMessage('⚠️ Please enter a file name.', 'error');
        return;
    }

    // Create FormData for server upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value.trim());

    try {
        const response = await fetch('/api/admin/upload-server', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Could not upload file.');
        }

        showMessage('✅ File uploaded successfully!', 'success');
        
        // Reset form
        form.reset();
        fileInput.value = '';
        fileNameDisplay.textContent = 'No file selected';
        document.getElementById('filePreview').innerHTML = '';
        document.getElementById('uploadStatus').textContent = '';
        
        // Reload list
        loadFiles();
    } catch (error) {
        console.error('Upload error:', error);
        showMessage('❌ ' + error.message, 'error');
    }
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

// Load files on page load
loadFiles();