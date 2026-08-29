const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/* =========================================================
   CLOUDINARY CONFIGURATION
========================================================= */

const CLOUD_NAME = "estyakproject";
const UPLOAD_PRESET = "resume_profiles";

/* =========================================================
   VARIABLES
========================================================= */

let currentProfileId = null;
const form = document.getElementById('profileForm');
const message = document.getElementById('message');
const loading = document.getElementById('loading');

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
            <img src="${url}" alt="Profile Preview">
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
    document.getElementById('profile_image_url').value = '';
    document.getElementById('imageUpload').value = '';
    showImagePreview('');
    document.getElementById('uploadStatus').textContent = '';
};

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => { message.className = 'message'; }, 5000);
}

function getFormData() {
    return {
        name: document.getElementById('name').value.trim(),
        title: document.getElementById('title').value.trim(),
        bio: document.getElementById('bio').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        location: document.getElementById('location').value.trim(),
        profile_image: document.getElementById('profile_image_url').value.trim(),
        resume_url: document.getElementById('resume_url').value.trim(),
        facebook_url: document.getElementById('facebook_url').value.trim(),
        linkedin_url: document.getElementById('linkedin_url').value.trim(),
        github_url: document.getElementById('github_url').value.trim(),
        about_bio: document.getElementById('aboutBio').value.trim(),
         stat_projects: document.getElementById('statProjects').value || 0,
    stat_clients: document.getElementById('statClients').value || 0,
    stat_experience: document.getElementById('statExperience').value || 0
    };
}

function fillForm(profile) {
    document.getElementById('name').value = profile.name || '';
    document.getElementById('title').value = profile.title || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('profile_image_url').value = profile.profile_image || '';
    document.getElementById('resume_url').value = profile.resume_url || '';
    document.getElementById('facebook_url').value = profile.facebook_url || '';
    document.getElementById('linkedin_url').value = profile.linkedin_url || '';
    document.getElementById('github_url').value = profile.github_url || '';
    document.getElementById('statProjects').value = profile.stat_projects || 0;
document.getElementById('statClients').value = profile.stat_clients || 0;
document.getElementById('statExperience').value = profile.stat_experience || 0;
    document.getElementById('aboutBio').value = profile.about_bio || '';

    if (profile.profile_image) {
        showImagePreview(profile.profile_image);
    }
}

async function getAccessToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/admin.html';
        return null;
    }
    return session.access_token;
}

async function loadProfile() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load profile.');
        }

        if (result.data && result.data.length > 0) {
            currentProfileId = result.data[0].id;
            fillForm(result.data[0]);
        }

        loading.style.display = 'none';
    } catch (error) {
        loading.textContent = error.message;
        showMessage(error.message, 'error');
    }
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
            document.getElementById('profile_image_url').value = imageUrl;
            showImagePreview(imageUrl);
        }

        this.value = '';
    });
}

// Image URL input change - show preview
const profileImageUrl = document.getElementById('profile_image_url');
if (profileImageUrl) {
    profileImageUrl.addEventListener('input', function() {
        const url = this.value.trim();
        if (url) {
            showImagePreview(url);
        } else {
            showImagePreview('');
        }
    });
}

/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = await getAccessToken();
    if (!token) return;

    const formData = getFormData();
    const url = currentProfileId ? `/api/profile/${currentProfileId}` : '/api/profile';
    const method = currentProfileId ? 'PUT' : 'POST';

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
            throw new Error(result.error || result.message || 'Could not save profile.');
        }

        if (result.data) {
            currentProfileId = result.data.id;
            fillForm(result.data);
        }

        showMessage(
            currentProfileId ? 'Profile saved successfully.' : 'Profile created successfully.',
            'success'
        );
    } catch (error) {
        console.error(error);
        showMessage(error.message, 'error');
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

loadProfile();