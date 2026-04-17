/**
 * Handles the logout process.
 * Hides the main application dashboard and shows the authentication section.
 */
function handleLogout() {
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-section').style.display = 'flex';
}
