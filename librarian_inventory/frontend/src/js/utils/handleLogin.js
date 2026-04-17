/**
 * Handles the login or signup submission process.
 * Prevents the default form submission, hides the authentication section, 
 * and reveals the main application dashboard.
 * 
 * @param {Event} e - The event object triggered by form submission or button click.
 */
const AUTH_USERS_KEY = 'lisAuthUsers';

function getStoredUsers() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveStoredUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function setAuthNotice(message, type = 'error') {
    const notice = document.getElementById('authNotice');
    if (!notice) return;
    notice.textContent = message;
    notice.className = `auth-notice ${type}`;
}

function clearAuthNotice() {
    const notice = document.getElementById('authNotice');
    if (!notice) return;
    notice.textContent = '';
    notice.className = 'auth-notice hidden';
}

function handleLogin(e) {
    if (e) e.preventDefault();

    const targetId = e?.target?.id;
    const isSocialLogin = targetId === 'googleLogin' || targetId === 'facebookLogin';

    if (targetId === 'signupForm') {
        const emailInput = document.getElementById('signupEmail');
        const nameInput = document.getElementById('signupName');
        const passwordInput = document.getElementById('signupPassword');

        const email = emailInput?.value?.trim().toLowerCase();
        if (!email) {
            setAuthNotice('Please enter an email address.', 'error');
            return;
        }

        const users = getStoredUsers();
        const alreadyExists = users.some((user) => user.email === email);
        if (alreadyExists) {
            setAuthNotice('This email already exists. Please log in instead.', 'error');
            return;
        }

        users.push({
            fullName: nameInput?.value?.trim() || '',
            email,
            password: passwordInput?.value || '',
            createdAt: new Date().toISOString()
        });
        saveStoredUsers(users);

        setAuthNotice('Account created. You can now log in with this email.', 'success');
        if (emailInput) {
            const loginEmail = document.getElementById('loginEmail');
            if (loginEmail) loginEmail.value = emailInput.value.trim();
        }
        if (typeof toggleAuth === 'function') {
            setTimeout(() => {
                toggleAuth(false);
                setAuthNotice('Account created. Please sign in.', 'success');
            }, 350);
        }
        return;
    }

    if (targetId === 'loginForm') {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        const email = emailInput?.value?.trim().toLowerCase();
        const password = passwordInput?.value || '';

        if (!email || !password) {
            setAuthNotice('Please enter both email and password.', 'error');
            return;
        }

        const users = getStoredUsers();
        const matchedUser = users.find((user) => user.email === email);
        if (!matchedUser) {
            setAuthNotice('No account found for this email. Please sign up first.', 'error');
            return;
        }

        if (matchedUser.password !== password) {
            setAuthNotice('Incorrect password. Please try again.', 'error');
            return;
        }

        clearAuthNotice();
        // Mark this user as online in the Users panel
        if (typeof setUserOnline === 'function') setUserOnline(email);
    }

    if (!isSocialLogin && targetId !== 'loginForm') {
        setAuthNotice('Unsupported login action.', 'error');
        return;
    }

    // Social logins: store a guest-style session
    if (isSocialLogin) {
        const guestEmail = `guest_${targetId}@social.login`;
        const users = getStoredUsers();
        if (!users.some(u => u.email === guestEmail)) {
            users.push({
                fullName: targetId === 'googleLogin' ? 'Google User' : 'Facebook User',
                email: guestEmail,
                password: '',
                createdAt: new Date().toISOString()
            });
            saveStoredUsers(users);
        }
        if (typeof setUserOnline === 'function') setUserOnline(guestEmail);
    }

    clearAuthNotice();
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');

    // Re-render the users panel now that the dashboard is visible
    if (typeof renderUsersPanel === 'function') renderUsersPanel();
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
