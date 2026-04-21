/**
 * GSAP Animations for the authentication section
 */
document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const glassContainer = authSection?.querySelector('.glass-container');
    
    if (!authSection || !glassContainer) return;

    // Use only the login form elements to prevent issues with hidden display:none signup elements
    const loginForm = document.getElementById('loginForm');
    const loginLogo = glassContainer.querySelector('.login-logo-row');
    const authInputs = loginForm ? loginForm.querySelectorAll('.auth-input') : [];
    const btnSignin = loginForm ? loginForm.querySelectorAll('.btn-signin') : [];

    // Remove CSS animation classes to prevent conflicts
    glassContainer.classList.remove('animate-fade-in');

    // Initial Login Card Entrance
    gsap.fromTo(glassContainer, 
        {
            y: 30,
            opacity: 0,
            autoAlpha: 0,
            scale: 0.98
        },
        {
            duration: 0.6,
            y: 0,
            opacity: 1,
            autoAlpha: 1,
            scale: 1,
            ease: "back.out(1.2)"
        }
    );
});
