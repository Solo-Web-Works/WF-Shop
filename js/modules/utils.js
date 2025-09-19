// Utility functions (cookies, dark mode, etc.)
export function initUtils() {
  // Cookie helpers
    window.setCookie = function(name, value, days = 30) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
    };

    window.getCookie = function(name) {
        const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    };

    // Dark mode toggle
    const body = document.body;
    const toggleDark = document.getElementById('darkModeToggle');
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const setDarkMode = (enabled) => {
        if (enabled) {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
            toggleDark.textContent = '☀️';
            toggleDark.title = 'Switch to light mode';
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
            toggleDark.textContent = '🌙';
            toggleDark.title = 'Switch to dark mode';
        }
    };

    if (stored === 'enabled' || (!stored && prefersDark)) {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }

    toggleDark.addEventListener('click', () => {
        setDarkMode(!body.classList.contains('dark-mode'));
    });
}
