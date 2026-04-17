/**
 * Handles the login or signup submission process.
 * Prevents the default form submission, hides the authentication section, 
 * and reveals the main application dashboard.
 * 
 * @param {Event} e - The event object triggered by form submission or button click.
 */
function handleLogin(e) {
    if (e) e.preventDefault();
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');
}

/**
 * Attaches event listeners for login and signup forms and social login buttons
 * once the document has loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    ['loginForm', 'googleLogin', 'facebookLogin', 'signupForm'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener(el.tagName === 'FORM' ? 'submit' : 'click', handleLogin);
    });
});
