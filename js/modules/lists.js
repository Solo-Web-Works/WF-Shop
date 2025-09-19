// Shopping list management
export function initLists() {
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

    let shoppingLists = [];
    let activeListId = null;
    let activeListSlugs = new Set();
    let pricesGroupMode = 'seller';

    async function fetchShoppingLists() {
        const response = await fetch('api/get-lists.php');
        shoppingLists = await response.json();

        renderShoppingListTabs();

        if (shoppingLists.length > 0) {
            const savedId = window.getCookie('activeListId');
            const found = shoppingLists.find(l => l.id == savedId);

            if (found) {
                activeListId = found.id;
            } else {
                activeListId = shoppingLists[0].id;
            }

            window.setCookie('activeListId', activeListId);
            renderShoppingListContent();
        }
    }

    function renderShoppingListTabs() {
        const savedId = window.getCookie('activeListId');
        const selectedId = (activeListId != null) ? activeListId : savedId;

        if (shoppingListTabs) shoppingListTabs.setAttribute('role', 'tablist');

        shoppingListTabs.innerHTML = '';

        const activate = (li, id) => {
            activeListId = id;
            window.setCookie('activeListId', activeListId);
            renderShoppingListContent();

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

        shoppingLists.forEach(list => {
            const li = document.createElement('li');

            li.setAttribute('role', 'tab');
            li.setAttribute('aria-controls', 'shopping-list-content');
            li.setAttribute('aria-selected', String(list.id == selectedId));

            li.tabIndex = (list.id == selectedId) ? 0 : -1;
            // Escape list name for display
            const safeName = String(list.name)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
            li.textContent = safeName;
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
                    case ' ': case 'Spacebar':
                        e.preventDefault();
                        activate(li, list.id);
                        return;
                    case 'ArrowRight': case 'Right':
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % tabs.length;
                        break;
                    case 'ArrowLeft': case 'Left':
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
                        return;
                }

                tabs.forEach(tab => tab.tabIndex = -1);

                const next = tabs[nextIndex];

                next.tabIndex = 0;
                next.focus();
            });

            shoppingListTabs.appendChild(li);
        });
    }

    async function renderShoppingListContent() {
        if (!activeListId) {
            shoppingListContent.innerHTML = '';
            updatePriceWarning();
            activeListSlugs = new Set();
            if (window.renderItems) window.renderItems();
            return;
        }

        shoppingListContent.innerHTML = '<div class="loading">Loading best prices…</div>';

        if (pricesBreakdown) {
            pricesBreakdown.innerHTML = '<div class="loading">Loading price breakdown…</div>';
        }

        const response = await fetch(`api/get-list-items.php?list_id=${activeListId}`);
        const listItems = (await response.json()).sort((a, b) => a.name.localeCompare(b.name));

        activeListSlugs = new Set(listItems.map(i => i.slug).filter(Boolean));

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

                        // Escape item.name for display
                        const safeItemName = String(item.name)
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;');

            if (displayName) {
                let linkName = encodeURIComponent(displayName);
                link = '<a target="_blank" rel="noopener noreferrer" href="https://wiki.warframe.com/w/' + linkName + '">' + safeItemName + '</a>';
            } else {
                link = safeItemName;
            }

            const labelDiv = document.createElement('div');
            labelDiv.classList.add('item-info');
            // Add wiki link and Warframe.market link
            const wfmLink = item.slug ? `<a target="_blank" rel="noopener noreferrer" href="https://warframe.market/items/${item.slug}" class="wfm-link" title="Open on Warframe.market">WFM</a>` : '';
            labelDiv.innerHTML = `<p>${link}${wfmLink ? ' · ' + wfmLink : ''}</p>`;

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

            const actions = document.createElement('div');
            actions.classList.add('actions');

            const refreshBtn = document.createElement('button');
            refreshBtn.classList.add('button', 'ghost');
            refreshBtn.textContent = 'Refresh';
            refreshBtn.title = `Refresh best price for ${item.name}`;
            refreshBtn.setAttribute('aria-label', `Refresh best price for ${item.name}`);
            refreshBtn.onclick = () => refreshItemPrice(item.slug, item.name, li, refreshBtn);
            actions.appendChild(refreshBtn);

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.setAttribute('aria-label', `Remove ${item.name} from shopping list`);
            removeButton.setAttribute('title', `Remove ${item.name} from shopping list`);
            removeButton.classList.add('button');
            removeButton.onclick = () => removeFromShoppingList(item.id);
            actions.appendChild(removeButton);

            li.appendChild(actions);

            ul.appendChild(li);
        });

        shoppingListContent.innerHTML = '';

        shoppingListContent.appendChild(ul);

        if (clearListBtn) {
            clearListBtn.style.display = listItems.length > 0 ? '' : 'none';
        }

        if (window.renderItems) window.renderItems();
    }

    function updatePriceWarning(lastCheckedTimestamp) {
        if (!priceWarning) return;

        if (!lastCheckedTimestamp) {
            priceWarning.innerHTML = '';
            return;
        }

        // Use UTC for all timestamps
        const lastChecked = new Date(lastCheckedTimestamp * 1000);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastChecked.getTime()) / 60000);
        let html = `<span class="last-checked">Last updated: ${lastChecked.toLocaleString('en-US', { timeZone: 'UTC' })} UTC</span>`;

        if (diffMinutes > 30) {
            html += `<br><span class="stale-warning">⚠️ Price data is more than 30 minutes old. Click \"Check Prices\" to refresh.</span>`;
        }

        priceWarning.innerHTML = html;
    }

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
            window.setCookie('activeListId', activeListId);
            renderShoppingListContent();
        }
    }

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

    window.addToShoppingList = addToShoppingList;

    async function removeFromShoppingList(listItemId) {
        await fetch('api/remove-from-list.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: listItemId })
        });

        renderShoppingListContent();
    }

    window.removeFromShoppingList = removeFromShoppingList;

    async function clearShoppingList() {
        if (!activeListId) return;
        await fetch('api/clear-list.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: activeListId })
        });

        renderShoppingListContent();
    }

    async function deleteShoppingList() {
        if (!activeListId) return;
        const confirmed = window.confirm('Are you sure you want to delete this shopping list?');
        if (!confirmed) return;
        await fetch('api/delete-list.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: activeListId })
        });

        const response = await fetch('api/get-lists.php');

        shoppingLists = await response.json();

        if (shoppingLists.length > 0) {
            activeListId = shoppingLists[0].id;
            window.setCookie('activeListId', activeListId);
            renderShoppingListTabs();
            renderShoppingListContent();
        } else {
            activeListId = null;
            window.setCookie('activeListId', '');
            renderShoppingListTabs();
            shoppingListContent.innerHTML = '';
            updatePriceWarning();
        }
    }

    async function checkPrices() {
        if (!activeListId) return;
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

    function renderPrices(prices) {
        let html = '';
        let newest = 0;
        let totalCost = 0;
        window._lastPrices = prices;

        for (const slug in prices) {
            const item = prices[slug];
            const lastChecked = item.last_checked;

            if (lastChecked > newest) newest = lastChecked;

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

        html += '<div class="kbd-hint">Tip: Tap the copy icon to copy a whisper for that seller and item.</div>';

        function escapeHtml(str) {
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        if (pricesGroupMode === 'seller') {
            const sellers = {};

            for (const slug in prices) {
                const item = prices[slug];
                const bestOrder = item.orders
                .filter(o => o.type === 'sell')
                .sort((a, b) => a.platinum - b.platinum)[0];

                if (bestOrder) {
                    const seller = bestOrder.user.ingameName;
                    if (!sellers[seller]) sellers[seller] = [];
                    sellers[seller].push({ name: item.name, price: bestOrder.platinum });
                }
            }

            for (const seller in sellers) {
                const safeSeller = escapeHtml(seller);
                html += `<h4>${safeSeller}</h4><ul>`;

                sellers[seller].forEach(item => {
                    const safeItemName = escapeHtml(item.name);
                    const aria = `Copy whisper for ${safeSeller} about ${safeItemName}`;
                    html += `<li><span class="line-left">${safeItemName}: ${item.price} Platinum</span><button class="seller-copy copy-icon" data-seller="${safeSeller}" data-item="${safeItemName}" data-price="${item.price}" title="${aria}" aria-label="${aria}">📋</button></li>`;
                });

                html += '</ul>';
            }
        } else {
            for (const slug in prices) {
                const item = prices[slug];
                const sellOrders = item.orders
                .filter(o => o.type === 'sell')
                .sort((a, b) => a.platinum - b.platinum)
                .slice(0, 5);

                const safeItemName = escapeHtml(item.name);
                html += `<h4>${safeItemName}</h4><ul>`;

                if (sellOrders.length > 0) {
                    const sellerMap = {};
                    sellOrders.forEach(order => {
                        const seller = order.user.ingameName;
                        const qty = (typeof order.quantity === 'number' && order.quantity > 0) ? order.quantity : 1;

                        if (!sellerMap[seller]) {
                            sellerMap[seller] = { price: order.platinum, quantity: 0 };
                        }

                        sellerMap[seller].quantity += qty;

                        if (order.platinum < sellerMap[seller].price) {
                            sellerMap[seller].price = order.platinum;
                        }
                    });

                    Object.keys(sellerMap).forEach(seller => {
                        const safeSeller = escapeHtml(seller);
                        const aria = `Copy whisper for ${safeSeller} about ${safeItemName}`;
                        html += `<li><span class="line-left">${safeSeller} (x${sellerMap[seller].quantity}): ${sellerMap[seller].price} Platinum</span><button class="seller-copy copy-icon" data-seller="${safeSeller}" data-item="${safeItemName}" data-price="${sellerMap[seller].price}" title="${aria}" aria-label="${aria}">📋</button></li>`;
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

    if (createListBtn) createListBtn.addEventListener('click', createShoppingList);
    if (clearListBtn) clearListBtn.addEventListener('click', clearShoppingList);
    if (delListBtn) delListBtn.addEventListener('click', deleteShoppingList);
    if (checkPricesBtn) checkPricesBtn.addEventListener('click', checkPrices);

    if (pricesGroupModeSelect) {
        pricesGroupModeSelect.addEventListener('change', (e) => {
            pricesGroupMode = pricesGroupModeSelect.value;
            // Always re-render prices with the new grouping
            if (window._lastPrices) renderPrices(window._lastPrices);
        });
    }

    fetchShoppingLists();
}
