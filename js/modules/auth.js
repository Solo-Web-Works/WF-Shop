// Authentication and user session logic
export function initAuth() {
    window.userSession = null;
    window.showLogin = false;
    window.authMessageTimeout = null;
    window.userAuthArea = document.getElementById('user-auth-area');

    // Helper to show authentication messages
    function showAuthMessage(msg, isError = false) {
        const msgDiv = document.getElementById('auth-message');

        if (msgDiv) {
            msgDiv.textContent = msg;
            msgDiv.style.backgroundColor = isError ? '#f8d7da' : '#d1e7dd';
            msgDiv.style.color = isError ? '#d9534f' : '#005f73';
            msgDiv.style.padding = '0.5rem';
            msgDiv.style.borderRadius = '0.25rem';
            msgDiv.style.textAlign = 'center';

            clearTimeout(window.authMessageTimeout);

            window.authMessageTimeout = setTimeout(() => {
                msgDiv.textContent = '';
                msgDiv.style.backgroundColor = '';
                msgDiv.style.color = '';
                msgDiv.style.padding = '';
                msgDiv.style.borderRadius = '';
                msgDiv.style.textAlign = '';
            }, 4000);
        }
    }

    // Render authentication UI
    function renderUserAuthUI() {
        const userAuthArea = window.userAuthArea;

        if (!userAuthArea) return;

        userAuthArea.innerHTML = '';

        if (window.userSession && window.userSession.username) {
            // Logged in: show user info with dropdown and logout button
            const userDiv = document.createElement('div');
            userDiv.className = 'user-info';
            userDiv.style.position = 'relative';

                        // Escape username for display
                        const safeUsername = String(window.userSession.username)
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;');
                        userDiv.innerHTML = `
                                <div class="user-dropdown">
                                <span id="user-dropdown-toggle">Logged in as <strong>${safeUsername}</strong> &#x25BC;</span>
                                <div id="user-dropdown-menu" class="dropdown-menu">
                                        <a href="#" id="change-password-link">Change Password</a>
                                        <a href="#" id="logout-btn">Logout</a>
                                </div>
                                </div>
                        `;

            userAuthArea.appendChild(userDiv);

            document.getElementById('logout-btn').onclick = (e) => {
                e.preventDefault();
                logoutUser();
            };

            // Dropdown logic (hover for desktop, click/tap for mobile)
            const toggle = document.getElementById('user-dropdown-toggle');
            const menu = document.getElementById('user-dropdown-menu');
            let dropdownTimeout;
            let isMenuOpen = false;

            toggle.addEventListener('mouseenter', () => {
                if (window.innerWidth > 800) {
                    clearTimeout(dropdownTimeout);
                    menu.style.display = 'block';
                    isMenuOpen = true;
                }
            });

            toggle.addEventListener('mouseleave', () => {
                if (window.innerWidth > 800) {
                    dropdownTimeout = setTimeout(() => { menu.style.display = 'none'; isMenuOpen = false; }, 200);
                }
            });

            menu.addEventListener('mouseenter', () => {
                if (window.innerWidth > 800) {
                    clearTimeout(dropdownTimeout);
                    menu.style.display = 'block';
                    isMenuOpen = true;
                }
            });

            menu.addEventListener('mouseleave', () => {
                if (window.innerWidth > 800) {
                    dropdownTimeout = setTimeout(() => { menu.style.display = 'none'; isMenuOpen = false; }, 200);
                }
            });

            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 800) {
                    e.preventDefault();
                    isMenuOpen = !isMenuOpen;
                    menu.style.display = isMenuOpen ? 'block' : 'none';
                }
            });

            document.addEventListener('click', function closeDropdown(e) {
                if (window.innerWidth > 800) return;
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    menu.style.display = 'none';
                    isMenuOpen = false;
                }
            });

            document.getElementById('change-password-link').onclick = (e) => {
                e.preventDefault();
                showChangePasswordModal();
                menu.style.display = 'none';
                isMenuOpen = false;
            };
        } else {
            // Not logged in: show either login or register form, with a toggle link
            const formDiv = document.createElement('div');
            formDiv.className = 'auth-forms';

            formDiv.innerHTML = window.showLogin ? `
                <form id="login-form" autocomplete="on">
                <input type="text" id="login-username" placeholder="Username" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button class="button" type="submit">Login</button>
                </form>
                <div class="auth-message">
                <a href="#" id="show-register-link">Need an account? Register</a>
                </div>
                <div id="auth-message" class="auth-message" role="status" aria-live="polite"></div>
            `
            : `
                <form id="register-form" autocomplete="on">
                <input type="text" id="register-username" placeholder="New Username" required>
                <input type="password" id="register-password" placeholder="New Password" required>
                <button class="button" type="submit">Register</button>
                </form>
                <div class="auth-message">
                <a href="#" id="show-login-link">Already have an account? Login</a>
                </div>
                <div id="auth-message" class="auth-message" role="status" aria-live="polite"></div>
            `;

            userAuthArea.appendChild(formDiv);

            if (window.showLogin) {
                document.getElementById('login-form').onsubmit = handleLoginSubmit;

                document.getElementById('show-register-link').onclick = (e) => {
                    e.preventDefault();
                    window.showLogin = false;
                    renderUserAuthUI();
                };
            } else {
                document.getElementById('register-form').onsubmit = handleRegisterSubmit;

                document.getElementById('show-login-link').onclick = (e) => {
                    e.preventDefault();
                    window.showLogin = true;
                    renderUserAuthUI();
                };
            }
        }
    }

    // Show modal for change password
    function showChangePasswordModal() {
        const existing = document.getElementById('change-password-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');

        modal.id = 'change-password-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.4)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '2000';

        modal.innerHTML = `
        <div id="password-modal">
            <button id="close-change-password-modal">&times;</button>
            <h3>Change Password</h3>
            <form id="change-password-form" autocomplete="off">
            <input type="password" id="current-password" placeholder="Current Password" required>
            <input type="password" id="new-password" placeholder="New Password" required>
            <button class="button" type="submit">Change Password</button>
            <span id="change-password-message"></span>
            </form>
        </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-change-password-modal').onclick = () => modal.remove();

        document.getElementById('change-password-form').onsubmit = handleChangePasswordSubmit;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async function handleChangePasswordSubmit(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const msgSpan = document.getElementById('change-password-message');

        msgSpan.textContent = '';
        msgSpan.style.color = '#005f73';

        try {
            const resp = await fetch('api/change-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await resp.json();

            if (resp.ok && data.success) {
                msgSpan.textContent = 'Password changed!';
                msgSpan.style.color = '#28a745';
                setTimeout(() => {
                    const modal = document.getElementById('change-password-modal');
                    if (modal) modal.remove();
                }, 1200);
            } else {
                msgSpan.textContent = data.error || 'Change failed.';
                msgSpan.style.color = '#d9534f';
            }
        } catch (e) {
            msgSpan.textContent = 'Change error.';
            msgSpan.style.color = '#d9534f';
        }

        setTimeout(() => { msgSpan.textContent = ''; }, 4000);

        document.getElementById('change-password-form').reset();
    }

    async function handleLoginSubmit(e) {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const normalizedUsername = username.toLowerCase();
        const password = document.getElementById('login-password').value;

        try {
            const resp = await fetch('api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: normalizedUsername, password })
            });

            const data = await resp.json();

            if (resp.ok && data.success) {
                window.userSession = { username: normalizedUsername };
                showAuthMessage('Login successful!');
                renderUserAuthUI();
                if (window.updateUIForAuthState) window.updateUIForAuthState();
                if (window.fetchShoppingLists) window.fetchShoppingLists();
            } else {
                showAuthMessage(data.error || 'Login failed.', true);
            }
        } catch (e) {
            showAuthMessage('Login error.', true);
        }
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const normalizedUsername = username.toLowerCase();
        const password = document.getElementById('register-password').value;

        try {
            const resp = await fetch('api/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: normalizedUsername, password })
            });

            const data = await resp.json();

            if (resp.ok && data.success) {
                window.showLogin = true;
                renderUserAuthUI();

                const loginUserEl = document.getElementById('login-username');
                const loginPassEl = document.getElementById('login-password');

                if (loginUserEl) loginUserEl.value = normalizedUsername;
                if (loginPassEl) loginPassEl.focus();

                showAuthMessage('Account created — you can now log in.');
            } else {
                showAuthMessage(data.error || 'Registration failed.', true);
            }
        } catch (e) {
            showAuthMessage('Registration error.', true);
        }
    }

    async function logoutUser() {
        try {
            await fetch('api/logout.php', { method: 'POST' });
        } catch (e) { }

        window.userSession = null;
        window.showLogin = true;

        renderUserAuthUI();

        if (window.updateUIForAuthState) window.updateUIForAuthState();

        const loginUserEl = document.getElementById('login-username');

        if (loginUserEl) loginUserEl.focus();

        showAuthMessage('You have been logged out.');
    }

    // Session check on load
    async function checkSession() {
        try {
            const resp = await fetch('api/session-check.php');

            if (resp.ok) {
                const data = await resp.json();
                if (data && data.username) {
                    window.userSession = data;
                } else {
                window.userSession = null;
                }
            } else {
                window.userSession = null;
            }
        } catch (e) {
            window.userSession = null;
        }

        renderUserAuthUI();
        if (window.updateUIForAuthState) window.updateUIForAuthState();
        if (window.userSession && window.userSession.username && window.fetchShoppingLists) {
            window.fetchShoppingLists();
        }
    }

    window.renderUserAuthUI = renderUserAuthUI;
    window.checkSession = checkSession;

    checkSession();
}
