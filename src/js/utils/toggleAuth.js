/**
 * Toggles between the login and signup forms within the authentication section.
 * 
 * @param {boolean} isSignup - If true, displays the signup form and hides the login form. If false, does the reverse.
 */
function toggleAuth(isSignup) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authNotice = document.getElementById('authNotice');
    if (authNotice) {
        authNotice.className = 'auth-notice hidden';
        authNotice.textContent = '';
    }
    if (isSignup) {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
    }
}
