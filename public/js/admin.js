const SUPABASE_URL = 'https://baepfcdvgruhvaccruum.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cDIynPGbHrsZjUK8gRhpDA_pu20FNiF';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
        return;
    }

    if (data.session) {
        window.location.href = '/admin-dashboard.html';
    }
});