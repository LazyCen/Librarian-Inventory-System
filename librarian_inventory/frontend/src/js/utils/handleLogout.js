/**
 * Handles the logout process.
 * Marks the current session user as offline, hides the dashboard,
 * and restores the authentication section.
 */
function handleLogout() {
    // Mark the active user offline before leaving the dashboard
    if (typeof getCurrentUserEmail === 'function' && typeof setUserOffline === 'function') {
        const email = getCurrentUserEmail();
        if (email) setUserOffline(email);
    }

    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-section').style.display = 'flex';
}
