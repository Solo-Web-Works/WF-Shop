document.addEventListener('DOMContentLoaded', () => {
    // Mobile tab logic
    const mobileTabs = document.getElementById('mobile-tabs');
    const tabItemsBtn = document.getElementById('tab-items');
    const tabListsBtn = document.getElementById('tab-lists');
    const itemCatalogPanel = document.getElementById('item-catalog-panel');
    const shoppingListsPanel = document.getElementById('shopping-lists-panel');

    function updateMobileTabs() {
        if (window.innerWidth <= 800) {
            if (mobileTabs) mobileTabs.style.display = 'flex';
            if (itemCatalogPanel) itemCatalogPanel.classList.remove('active');
            if (shoppingListsPanel) shoppingListsPanel.classList.remove('active');
            // Default to items tab
            if (tabItemsBtn && tabItemsBtn.classList.contains('active')) {
                if (itemCatalogPanel) itemCatalogPanel.classList.add('active');
            } else if (tabListsBtn && tabListsBtn.classList.contains('active')) {
                if (shoppingListsPanel) shoppingListsPanel.classList.add('active');
            }
        } else {
            if (mobileTabs) mobileTabs.style.display = 'none';
            if (itemCatalogPanel) itemCatalogPanel.classList.add('active');
            if (shoppingListsPanel) shoppingListsPanel.classList.add('active');
        }
    }

    if (tabItemsBtn && tabListsBtn) {
        tabItemsBtn.addEventListener('click', () => {
            tabItemsBtn.classList.add('active');
            tabListsBtn.classList.remove('active');
            updateMobileTabs();
        });
        tabListsBtn.addEventListener('click', () => {
            tabListsBtn.classList.add('active');
            tabItemsBtn.classList.remove('active');
            updateMobileTabs();
        });
    }

    window.addEventListener('resize', updateMobileTabs);
    // Initial tab state
    setTimeout(updateMobileTabs, 0);
    // --- User Authentication State ---
    let userSession = null;
    const userAuthArea = document.getElementById('user-auth-area');
    let authMessageTimeout = null;

    // Render user authentication UI (login/register/logout or user info)
    // Only show one form (login or register) at a time
    let showLogin = true;
    function renderUserAuthUI() {
        if (!userAuthArea) return;
        userAuthArea.innerHTML = '';
        if (userSession && userSession.username) {
            // Logged in: show user info with dropdown and logout button
            const userDiv = document.createElement('div');
            userDiv.className = 'user-info';
            userDiv.style.position = 'relative';
            userDiv.innerHTML = `
                <div class="user-dropdown">
                    <span id="user-dropdown-toggle">Logged in as <strong>${userSession.username}</strong> &#x25BC;</span>
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

            // Desktop: hover
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

            // Mobile: click/tap
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 800) {
                    e.preventDefault();
                    isMenuOpen = !isMenuOpen;
                    menu.style.display = isMenuOpen ? 'block' : 'none';
                }
            });

            // Close dropdown on outside click (mobile)
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
            formDiv.innerHTML = showLogin ? `
                <form id="login-form" autocomplete="on">
                    <input type="text" id="login-username" placeholder="Username" required>
                    <input type="password" id="login-password" placeholder="Password" required>
                    <button class="button" type="submit">Login</button>
                </form>
                <div class="auth-message">
                    <a href="#" id="show-register-link">Need an account? Register</a>
                </div>
                <div class="auth-message"></div>
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
                <div class="auth-message"></div>
            `;
            userAuthArea.appendChild(formDiv);
            if (showLogin) {
                document.getElementById('login-form').onsubmit = handleLoginSubmit;
                document.getElementById('show-register-link').onclick = (e) => {
                    e.preventDefault();
                    showLogin = false;
                    renderUserAuthUI();
                };
            } else {
                document.getElementById('register-form').onsubmit = handleRegisterSubmit;
                document.getElementById('show-login-link').onclick = (e) => {
                    e.preventDefault();
                    showLogin = true;
                    renderUserAuthUI();
                };
            }
        }
    }

    // Show modal for change password
    function showChangePasswordModal() {
        // Remove any existing modal
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
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Change password handler (for modal)
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

    // Show auth message (success/error)
    function showAuthMessage(msg, isError = false) {
        const msgDiv = document.getElementById('auth-message');
        if (msgDiv) {
            msgDiv.textContent = msg;
            msgDiv.style.color = isError ? '#d9534f' : '#005f73';
            clearTimeout(authMessageTimeout);
            authMessageTimeout = setTimeout(() => { msgDiv.textContent = ''; }, 4000);
        }
    }

    // Session check on load
    async function checkSession() {
        try {
            const resp = await fetch('api/session-check.php');
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.username) {
                    userSession = data;
                } else {
                    userSession = null;
                }
            } else {
                userSession = null;
            }
        } catch (e) {
            userSession = null;
        }
        renderUserAuthUI();
        updateUIForAuthState();
        if (userSession && userSession.username) {
            fetchShoppingLists();
        }
    }

    // Login handler
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
                userSession = { username: normalizedUsername };
                showAuthMessage('Login successful!');
                renderUserAuthUI();
                updateUIForAuthState();
                fetchShoppingLists();
            } else {
                showAuthMessage(data.error || 'Login failed.', true);
            }
        } catch (e) {
            showAuthMessage('Login error.', true);
        }
    }

    // Register handler
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
                showAuthMessage('Registration successful! You can now log in.');
            } else {
                showAuthMessage(data.error || 'Registration failed.', true);
            }
        } catch (e) {
            showAuthMessage('Registration error.', true);
        }
    }

    // Logout handler
    async function logoutUser() {
        try {
            await fetch('api/logout.php', { method: 'POST' });
        } catch (e) { }

        userSession = null;

        updateUIForAuthState();
        fetchShoppingLists();
    }

    // Enable/disable UI based on login state
    function updateUIForAuthState() {
        // Disable list controls if not logged in
        const controls = [
            document.getElementById('create-list-btn'),
            document.getElementById('new-list-name'),
            document.getElementById('check-prices-btn'),
            document.getElementById('clear-list-btn'),
            document.getElementById('prices-group-mode')
        ];
        controls.forEach(ctrl => {
            if (ctrl) ctrl.disabled = !userSession;
        });

        // Hide shopping lists and item catalog if not logged in
        const shoppingListsDiv = document.querySelector('.shopping-lists');
        const itemCatalogDiv = document.querySelector('.item-catalog');
        if (shoppingListsDiv) shoppingListsDiv.style.display = userSession ? '' : 'none';
        if (itemCatalogDiv) itemCatalogDiv.style.display = userSession ? '' : 'none';
    }
    // Dark mode toggle
    const body = document.body;
    const toggleDark = document.getElementById('darkModeToggle');
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Elements
    const itemList = document.getElementById('item-list');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('globalSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const shoppingListTabs = document.getElementById('shopping-list-tabs');
    const shoppingListContent = document.getElementById('shopping-list-content');
    const newListNameInput = document.getElementById('new-list-name');
    const createListBtn = document.getElementById('create-list-btn');
    const checkPricesBtn = document.getElementById('check-prices-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    const delListBtn = document.getElementById('delete-list-btn');
    const priceWarning = document.getElementById('price-warning');
    const totalCostDiv = document.getElementById('total-cost');
    const pricesBreakdown = document.getElementById('prices-breakdown');
    const pricesGroupModeSelect = document.getElementById('prices-group-mode');
    let items = [];
    let shoppingLists = [];
    let activeListId = null;
    // Track which item slugs are in the active list to disable duplicate adds
    let activeListSlugs = new Set();

    // Cookie helpers
    function setCookie(name, value, days = 30) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
    }
    function getCookie(name) {
        const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    }
    let pricesGroupMode = 'seller';

    // Fetch items and categories
    async function fetchItems() {
        const response = await fetch('api/get-items.php');

        if (!response.ok) {
            console.error('Failed to fetch items:', response.statusText);
            return;
        }

        items = await response.json();

        renderItems();

        populateCategories();
    }

    // Render items
    function renderItems() {
        // UX: Search-only UI gates results until the user types ≥ 2 characters.
        // This avoids rendering the full catalog by default and encourages targeted queries.
        const q = (searchInput?.value || '').trim();
        // If there is no search query or fewer than 2 chars, show a hint
        if (q.length < 2) {
            itemList.innerHTML = '<li class="empty-hint">Type at least 2 characters to search</li>';
            return;
        }

        itemList.innerHTML = '';

        const filteredItems = items
            .filter(item => {
                const searchMatch = item.name.toLowerCase().includes(q.toLowerCase());
                const categoryMatch = categoryFilter.value ? item.tags.includes(categoryFilter.value) : true;
                const excludeModInWarframe = !(categoryFilter.value === 'warframe' && item.tags.includes('mod'));
                // Search mode only; no alphabetic index
                return searchMatch && categoryMatch && excludeModInWarframe;
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // Empty state when a valid query returns no matches
        if (filteredItems.length === 0) {
            itemList.innerHTML = '<li class="empty-hint">No items match your search</li>';
            return;
        }

        filteredItems.forEach((item, index) => {
            const li = document.createElement('li');

            li.textContent = item.name;

            if (index % 2 === 1) {
                li.classList.add('stripe');
            }

            const addButton = document.createElement('button');

            addButton.textContent = 'Add';
            addButton.classList.add('button');
            const alreadyInList = activeListSlugs && activeListSlugs.has(item.slug);
            if (alreadyInList) {
                addButton.disabled = true;
                addButton.classList.add('added');
                addButton.textContent = 'Added';
                addButton.title = `${item.name} is already in the active list`;
                addButton.setAttribute('aria-label', `${item.name} is already in the active list`);
            } else {
                addButton.onclick = () => addToShoppingList(item.id);
                addButton.title = `Add ${item.name} to active list`;
                addButton.setAttribute('aria-label', `Add ${item.name} to active list`);
            }

            li.appendChild(addButton);

            itemList.appendChild(li);
        });
    }

    // Populate categories
    function populateCategories() {
        const categories = new Set();

        items.forEach(item => {
            item.tags.split(',').forEach(tag => categories.add(tag));
        });

        Array.from(categories)
            .sort((a, b) => a.localeCompare(b))
            .forEach(category => {
                const allowedCategories = ['weapon', 'mod', 'arcane_enhancement', 'warframe', 'set'];

                if (!allowedCategories.includes(category)) return;

                const option = document.createElement('option');

                option.value = category;
                option.textContent = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                categoryFilter.appendChild(option);
            });
    }

    // Fetch shopping lists
    async function fetchShoppingLists() {
        const response = await fetch('api/get-lists.php');

        shoppingLists = await response.json();

        renderShoppingListTabs();

        if (shoppingLists.length > 0) {
            // Try to restore from cookie
            const savedId = getCookie('activeListId');
            const found = shoppingLists.find(l => l.id == savedId);

            if (found) {
                activeListId = found.id;
            } else {
                activeListId = shoppingLists[0].id;
            }

            setCookie('activeListId', activeListId);

            renderShoppingListContent();
        }
    }

    // Render shopping list tabs
    function renderShoppingListTabs() {
        const savedId = getCookie('activeListId');
        const selectedId = (activeListId != null) ? activeListId : savedId;

        if (shoppingListTabs) shoppingListTabs.setAttribute('role', 'tablist');
        shoppingListTabs.innerHTML = '';

        const activate = (li, id) => {
            activeListId = id;
            setCookie('activeListId', activeListId);
            renderShoppingListContent();
            // Update visual and ARIA selection state
            const tabsAll = shoppingListTabs.querySelectorAll('li[role="tab"]');
            tabsAll.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
                tab.tabIndex = -1;
            });
            li.classList.add('active');
            li.setAttribute('aria-selected', 'true');
            li.tabIndex = 0;
            li.focus();
        };

        // Build tabs
        shoppingLists.forEach(list => {
            const li = document.createElement('li');

            li.setAttribute('role', 'tab');
            li.setAttribute('aria-controls', 'shopping-list-content');
            li.setAttribute('aria-selected', String(list.id == selectedId));
            li.tabIndex = (list.id == selectedId) ? 0 : -1; // roving tabindex
            li.textContent = list.name;
            li.dataset.id = list.id;

            if (list.id == selectedId) {
                li.classList.add('active');
            }

            li.addEventListener('click', () => activate(li, list.id));
            li.addEventListener('keydown', (e) => {
                const tabs = Array.from(shoppingListTabs.querySelectorAll('li[role="tab"]'));
                const currentIndex = tabs.indexOf(li);
                let nextIndex = currentIndex;

                switch (e.key) {
                    case 'Enter':
                    case ' ': // Space
                    case 'Spacebar':
                        e.preventDefault();
                        activate(li, list.id);
                        return;
                    case 'ArrowRight':
                    case 'Right':
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % tabs.length;
                        break;
                    case 'ArrowLeft':
                    case 'Left':
                        e.preventDefault();
                        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        break;
                    case 'Home':
                        e.preventDefault();
                        nextIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        nextIndex = tabs.length - 1;
                        break;
                    default:
                        return; // do nothing for other keys
                }

                // Move focus only (do not activate)
                tabs.forEach(tab => tab.tabIndex = -1);
                const next = tabs[nextIndex];
                next.tabIndex = 0;
                next.focus();
            });

            shoppingListTabs.appendChild(li);
        });
    }

    // Render shopping list content
    async function renderShoppingListContent() {
        if (!activeListId) {
            shoppingListContent.innerHTML = '';
            updatePriceWarning();
            // No active list -> allow all adds
            activeListSlugs = new Set();
            // Refresh item list to update disabled state
            renderItems();
            return;
        }

        // Show loading indicators while fetching list items and orders
        shoppingListContent.innerHTML = '<div class="loading">Loading best prices…</div>';
        if (pricesBreakdown) {
            pricesBreakdown.innerHTML = '<div class="loading">Loading price breakdown…</div>';
        }

        // Fetch list items
        const response = await fetch(`api/get-list-items.php?list_id=${activeListId}`);
        const listItems = (await response.json()).sort((a, b) => a.name.localeCompare(b.name));
        // Update the set of slugs present in the active list
        activeListSlugs = new Set(listItems.map(i => i.slug).filter(Boolean));

        // Fetch cached price/order data for all items and show price breakdown
        let lastChecked = null;

        const prices = {};

        if (listItems.length > 0) {
            await Promise.all(listItems.map(async (item) => {
                if (!item.slug) return;

                try {
                    const resp = await fetch(`api/get-orders-cache.php?item_slug=${item.slug}`);
                    const orderData = await resp.json();

                    prices[item.slug] = {
                        name: item.name,
                        orders: orderData[item.slug].orders,
                        last_checked: orderData[item.slug].last_checked
                    };

                    if (orderData[item.slug].last_checked && (!lastChecked || orderData[item.slug].last_checked > lastChecked)) {
                        lastChecked = orderData[item.slug].last_checked;
                    }
                } catch (e) { }
            }));
        }

        updatePriceWarning(lastChecked);

        renderPrices(prices);

        const ul = document.createElement('ul');

        listItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('list-item');
            if (index % 2 === 1) {
                li.classList.add('stripe');
            }

            function getWikiTitle(rawName) {
                let name = String(rawName || '').trim().replace(/\s+/g, ' ');

                // Skip linking if it's a Scene
                if (/Scene/i.test(name)) {
                    return null;
                }

                // If this is a Prime item, keep everything up to the standalone word "Prime"
                // This won't match "Primed" because of the word-boundary.
                if (/\bPrime\b/.test(name)) {
                    // "Acceltra Prime Barrel" -> "Acceltra Prime"
                    name = name.replace(/^(.+?\bPrime)\b.*$/, '$1');
                } else if (/\bWraith\b/.test(name)) {
                    // "Furax Wraith Left Gauntlet" -> "Furax Wraith"
                    name = name.replace(/^(.+?\bWraith)\b.*$/, '$1');
                } else {
                    // Non-prime: strip known component suffixes, optionally followed by "Blueprint"
                    // Handles things like:
                    // "Aeolak Barrel Blueprint" -> "Aeolak"
                    // "Aeolak Receiver"         -> "Aeolak"
                    // "Aeolak Set"              -> "Aeolak"
                    name = name
                    .replace(/\b(Barrel|Receiver|Stock)\b(?:\s+Blueprint)?$/i, '')
                    .replace(/\b(Blade|Guard|Handle)\b(?:\s+Blueprint)?$/i, '')
                    .replace(/\b(Heatsink|Hilt|Chassis)\b(?:\s+Blueprint)?$/i, '')
                    .replace(/\b(Limbs|Upper Limb|Lower Limb)\b(?:\s+Blueprint)?$/i, '')
                    .replace(/\b(Set|Blueprint)\b$/i, '');
                }

                return name.trim();
            }

            let displayName = getWikiTitle(item.name);
            let link = null;

            if (displayName) {
                let linkName = encodeURIComponent(displayName);

                link = '<a target="_blank" href="https://wiki.warframe.com/w/' + linkName + '">' + item.name + '</a>';
            } else {
                link = item.name;
            }

            const labelDiv = document.createElement('div');
            labelDiv.classList.add('item-info');
            labelDiv.innerHTML = '<p>' + link + '</p>';

            // Determine best price from freshly fetched orders when available,
            // falling back to any server-provided item.price
            let bestPrice = null;
            const priceData = item.slug ? prices[item.slug] : null;
            if (priceData && Array.isArray(priceData.orders)) {
                const bestOrder = priceData.orders
                    .filter(o => o.type === 'sell')
                    .sort((a, b) => a.platinum - b.platinum)[0];
                if (bestOrder) {
                    bestPrice = bestOrder.platinum;
                }
            } else if (item.price !== null && item.price !== undefined) {
                bestPrice = item.price;
            }

            if (bestPrice !== null && bestPrice !== undefined) {
                const priceSpan = document.createElement('span');
                priceSpan.classList.add('price');
                priceSpan.textContent = `Best Price: ${bestPrice} Platinum`;
                labelDiv.appendChild(priceSpan);
            }
            li.appendChild(labelDiv);

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.setAttribute('aria-label', `Remove ${item.name} from shopping list`);
            removeButton.setAttribute('title', `Remove ${item.name} from shopping list`);
            removeButton.classList.add('button');
            removeButton.onclick = () => removeFromShoppingList(item.id);
            li.appendChild(removeButton);

            ul.appendChild(li);
        });

        shoppingListContent.innerHTML = '';
        shoppingListContent.appendChild(ul);

        // Show/hide Clear List button based on whether there are items
        if (clearListBtn) {
            if (listItems.length > 0) {
                clearListBtn.style.display = '';
            } else {
                clearListBtn.style.display = 'none';
            }
        }
        // Refresh item catalog to reflect disabled Add buttons
        renderItems();
    }


    // Create a new shopping list
    async function createShoppingList() {
        const name = newListNameInput.value.trim();

        if (name) {
            const response = await fetch('api/create-list.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            const newList = await response.json();

            shoppingLists.push(newList);

            newListNameInput.value = '';

            renderShoppingListTabs();

            activeListId = newList.id;
            setCookie('activeListId', activeListId);

            renderShoppingListContent();
        }
    }

    // Add item to shopping list
    async function addToShoppingList(itemId) {
        if (activeListId) {
            await fetch('api/add-to-list.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ list_id: activeListId, item_id: itemId })
            });

            renderShoppingListContent();
        }
    }

    // Remove item from shopping list
    async function removeFromShoppingList(listItemId) {
        await fetch('api/remove-from-list.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: listItemId })
        });

        renderShoppingListContent();
    }

    // Clear all items from the active shopping list
    async function clearShoppingList() {
        if (!activeListId) return;

        await fetch('api/clear-list.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: activeListId })
        });

        renderShoppingListContent();
    }

    // Delete the active shopping list
    async function deleteShoppingList() {
        if (!activeListId) return;

        const confirmed = window.confirm('Are you sure you want to delete this shopping list?');
        if (!confirmed) return;

        await fetch('api/delete-list.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: activeListId })
        });

        // Re-fetch lists and update UI
        const response = await fetch('api/get-lists.php');
        shoppingLists = await response.json();

        if (shoppingLists.length > 0) {
            activeListId = shoppingLists[0].id;
            setCookie('activeListId', activeListId);
            renderShoppingListTabs();
            renderShoppingListContent();
        } else {
            activeListId = null;
            setCookie('activeListId', '');
            renderShoppingListTabs();
            shoppingListContent.innerHTML = '';
            updatePriceWarning();
        }
    }

    // Check prices for the active list
    async function checkPrices() {
        if (!activeListId) return;

        // Indicate loading and temporarily disable the button
        if (checkPricesBtn) {
            checkPricesBtn.disabled = true;
            checkPricesBtn.textContent = 'Checking…';
        }
        if (pricesBreakdown) {
            pricesBreakdown.innerHTML = '<div class="loading">Loading price breakdown…</div>';
        }

        try {
            const response = await fetch(`api/get-list-items.php?list_id=${activeListId}`);
            const listItems = await response.json();

            const itemsWithSlugs = listItems.map(item => ({ name: item.name, slug: item.slug }));

            const prices = {};

            for (const item of itemsWithSlugs) {
                const response = await fetch(`api/get-orders-cache.php?item_slug=${item.slug}`);
                const orderData = await response.json();

                // Copy last_checked from API response if present
                prices[item.slug] = {
                    name: item.name,
                    orders: orderData[item.slug].orders,
                    last_checked: orderData[item.slug].last_checked
                };
            }

            renderPrices(prices);
        } finally {
            if (checkPricesBtn) {
                checkPricesBtn.disabled = false;
                checkPricesBtn.textContent = 'Check Prices';
            }
        }
    }

    // Render prices
    function renderPrices(prices) {
        let html = '';
        let newest = 0;
        let totalCost = 0;

        window._lastPrices = prices; // Save for re-rendering

        // Update the warning text in the actions area and compute total cost
        for (const slug in prices) {
            const item = prices[slug];
            const lastChecked = item.last_checked;
            if (lastChecked > newest) newest = lastChecked;

            // Find best price for this item
            const bestOrder = item.orders
                .filter(o => o.type === 'sell')
                .sort((a, b) => a.platinum - b.platinum)[0];

            if (bestOrder) {
                totalCost += bestOrder.platinum;
            }
        }

        updatePriceWarning(newest);

        if (totalCostDiv) {
            totalCostDiv.textContent = `Total Cost: ${totalCost} Platinum`;
        }

        // Add interaction hint
        html += '<div class="kbd-hint">Tip: Tap the copy icon to copy a whisper for that seller and item.</div>';

        if (pricesGroupMode === 'seller') {
            // Group by seller: show only the best seller for each item, grouped by seller (no seller quantity shown)
            const sellers = {};
            for (const slug in prices) {
                const item = prices[slug];
                // Find best sell order for this item
                const bestOrder = item.orders
                    .filter(o => o.type === 'sell')
                    .sort((a, b) => a.platinum - b.platinum)[0];
                if (bestOrder) {
                    const seller = bestOrder.user.ingameName;
                    if (!sellers[seller]) sellers[seller] = [];
                    sellers[seller].push({
                        name: item.name,
                        price: bestOrder.platinum
                    });
                }
            }
            for (const seller in sellers) {
                html += `<h4>${seller}</h4><ul>`;
                sellers[seller].forEach(item => {
                    const aria = `Copy whisper for ${seller} about ${item.name}`;
                    html += `<li><span class="line-left">${item.name}: ${item.price} Platinum</span><button class="seller-copy copy-icon" data-seller="${seller}" data-item="${item.name}" title="${aria}" aria-label="${aria}">📋</button></li>`;
                });
                html += '</ul>';
            }
        } else {
            // Group by item: show top 5 sellers for each item, with seller quantity for each
            for (const slug in prices) {
                const item = prices[slug];
                // Get top 5 sell orders by price
                const sellOrders = item.orders
                    .filter(o => o.type === 'sell')
                    .sort((a, b) => a.platinum - b.platinum)
                    .slice(0, 5);
                html += `<h4>${item.name}</h4><ul>`;
                if (sellOrders.length > 0) {
                    // Aggregate by seller, sum their quantities at their lowest price
                    const sellerMap = {};
                    sellOrders.forEach(order => {
                        const seller = order.user.ingameName;
                        const qty = (typeof order.quantity === 'number' && order.quantity > 0) ? order.quantity : 1;
                        if (!sellerMap[seller]) {
                            sellerMap[seller] = { price: order.platinum, quantity: 0 };
                        }
                        sellerMap[seller].quantity += qty;
                        // Always show the lowest price for this seller/item
                        if (order.platinum < sellerMap[seller].price) {
                            sellerMap[seller].price = order.platinum;
                        }
                    });
                    // Output sellers in order of appearance in sellOrders
                    Object.keys(sellerMap).forEach(seller => {
                        const aria = `Copy whisper for ${seller} about ${item.name}`;
                        html += `<li><span class="line-left">${seller} (x${sellerMap[seller].quantity}): ${sellerMap[seller].price} Platinum</span><button class="seller-copy copy-icon" data-seller="${seller}" data-item="${item.name}" title="${aria}" aria-label="${aria}">📋</button></li>`;
                    });
                } else {
                    html += `<li>No sellers found</li>`;
                }
                html += '</ul>';
            }
        }

        if (pricesBreakdown) {
            pricesBreakdown.innerHTML = html;
        }
    }

    // Whisper copy handler for seller buttons
    if (pricesBreakdown) {
        pricesBreakdown.addEventListener('click', async (e) => {
            const btn = e.target.closest('.seller-copy');
            if (!btn) return;
            const seller = btn.getAttribute('data-seller');
            const itemName = btn.getAttribute('data-item');
            if (!seller || !itemName) return;
            const msg = `/w ${seller} I'm interested in your ${itemName}. Is it still available?`;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(msg);
                } else {
                    // Fallback for older browsers
                    const ta = document.createElement('textarea');
                    ta.value = msg;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                // Lightweight feedback
                const prev = btn.textContent;
                btn.textContent = 'Copied!';
                btn.disabled = true;
                setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 1200);
            } catch (err) {
                console.error('Copy failed', err);
            }
        });
    }

    // Update the price warning in the actions area
    function updatePriceWarning(lastCheckedTimestamp) {
        if (!priceWarning) return;

        if (!lastCheckedTimestamp) {
            priceWarning.innerHTML = '';
            return;
        }

        const lastChecked = new Date(lastCheckedTimestamp * 1000);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastChecked) / 60000);

        let html = `<span class="last-checked">Last updated: ${lastChecked.toLocaleString()}</span>`;

        if (diffMinutes > 30) {
            html += `<br><span class="stale-warning">⚠️ Price data is more than 30 minutes old. Click \"Check Prices\" to refresh.</span>`;
        }

        priceWarning.innerHTML = html;
    }

    // Dark mode toggle functionality
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

    // On first load: use saved setting or system preference
    if (stored === 'enabled' || (!stored && prefersDark)) {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }

    // Event Listeners
    toggleDark.addEventListener('click', () => {
        setDarkMode(!body.classList.contains('dark-mode'));
    });

    checkPricesBtn.addEventListener('click', checkPrices);
    function updateSearchUI() {
        const q = (searchInput?.value || '').trim();
        if (clearSearchBtn) clearSearchBtn.style.display = q.length > 0 ? '' : 'none';
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateSearchUI();
            renderItems();
        });
        // Initialize state on load
        updateSearchUI();
    }
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            updateSearchUI();
            renderItems();
            searchInput.focus();
        });
    }

    // Keyboard shortcuts: '/' focuses search, 'Escape' clears it
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

        // Focus search with '/'
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (!isTyping && searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
        }

        // Clear search with Escape
        if (e.key === 'Escape') {
            if (searchInput && (searchInput.value || document.activeElement === searchInput)) {
                e.preventDefault();
                searchInput.value = '';
                updateSearchUI();
                renderItems();
                searchInput.focus();
            }
        }
    });
    categoryFilter.addEventListener('change', renderItems);
    createListBtn.addEventListener('click', createShoppingList);
    clearListBtn.addEventListener('click', clearShoppingList);
    delListBtn.addEventListener('click', deleteShoppingList);

    if (pricesGroupModeSelect) {
        pricesGroupModeSelect.addEventListener('change', (e) => {
            pricesGroupMode = pricesGroupModeSelect.value;
            // Re-render prices with the last known data
            if (window._lastPrices) renderPrices(window._lastPrices);
        });
    }

    // Initial load
    checkSession();
    fetchItems();
    // fetchShoppingLists() and checkPrices() will be called after login
});
