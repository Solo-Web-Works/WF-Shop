// Item catalog and search logic
export function initItems() {
    // Elements
    const itemList = document.getElementById('item-list');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('globalSearch');
    const clearSearchBtn = document.getElementById('clearSearch');

    let items = [];
    let activeListSlugs = new Set();
    let searchFocusIndex = -1;
    let searchPendingFocus = null; // { slug?, name? }

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

    function renderItems() {
        const q = (searchInput?.value || '').trim();

        if (q.length < 2) {
            itemList.innerHTML = '<li class="empty-hint">Type at least 2 characters to search</li>';

            if (searchInput) {
                searchInput.setAttribute('aria-expanded', 'false');
                searchInput.removeAttribute('aria-activedescendant');
            }

            return;
        }

        itemList.innerHTML = '';

        itemList.setAttribute('role', 'listbox');

        if (searchInput) searchInput.setAttribute('aria-expanded', 'true');

        const filteredItems = items
        .filter(item => {
            const searchMatch = item.name.toLowerCase().includes(q.toLowerCase());
            const categoryMatch = categoryFilter.value ? item.tags.includes(categoryFilter.value) : true;
            const excludeModInWarframe = !(categoryFilter.value === 'warframe' && item.tags.includes('mod'));
            return searchMatch && categoryMatch && excludeModInWarframe;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

        if (filteredItems.length === 0) {
            itemList.innerHTML = '<li class="empty-hint">No items match your search</li>';

            if (searchInput) {
                searchInput.setAttribute('aria-expanded', 'false');
                searchInput.removeAttribute('aria-activedescendant');
            }

            return;
        }

        filteredItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.setAttribute('tabindex', '-1');

            if (item.slug) li.dataset.slug = item.slug;
            const itemName = String(item.name);
            li.dataset.name = itemName;

            const optionId = `item-opt-${item.slug || ('idx-' + index)}`;

            li.id = optionId;
            li.textContent = itemName;

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
                addButton.title = `${itemName} is already in the active list`;
                addButton.setAttribute('aria-label', `${itemName} is already in the active list`);
            } else {
                addButton.onclick = () => window.addToShoppingList(item.id);
                addButton.title = `Add ${itemName} to active list`;
                addButton.setAttribute('aria-label', `Add ${itemName} to active list`);
            }

            li.appendChild(addButton);
            itemList.appendChild(li);
        });

        searchFocusIndex = -1;
        refreshSearchListRovingTabindex();

        if (searchPendingFocus && itemList) {
            const rows = getSearchRows();
            let idx = -1;

            if (searchPendingFocus.slug) {
                idx = rows.findIndex(li => li.dataset && li.dataset.slug === searchPendingFocus.slug);
            }

            if (idx < 0 && searchPendingFocus.name) {
                idx = rows.findIndex(li => li.dataset && li.dataset.name === searchPendingFocus.name);
            }

            if (idx >= 0) {
                focusSearchRow(idx, true);
            }

            searchPendingFocus = null;
        }
    }

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

    function getSearchRows() {
        if (!itemList) return [];
        return Array.from(itemList.querySelectorAll('li')).filter(li => !li.classList.contains('empty-hint'));
    }

    function refreshSearchListRovingTabindex() {
        const rows = getSearchRows();

        rows.forEach((li, i) => {
            li.setAttribute('tabindex', i === searchFocusIndex ? '0' : '-1');
            li.setAttribute('aria-selected', i === searchFocusIndex ? 'true' : 'false');
        });

        if (searchInput) {
            const activeEl = rows[searchFocusIndex];

            if (activeEl && activeEl.id) {
                searchInput.setAttribute('aria-activedescendant', activeEl.id);
            } else {
                searchInput.removeAttribute('aria-activedescendant');
            }
        }
    }

    function focusSearchRow(index, scroll) {
        const rows = getSearchRows();

        if (rows.length === 0) return;

        const clamped = Math.max(0, Math.min(rows.length - 1, index));

        searchFocusIndex = clamped;

        refreshSearchListRovingTabindex();

        const el = rows[clamped];

        if (el) {
            el.focus({ preventScroll: !scroll });
            if (scroll) el.scrollIntoView({ block: 'nearest' });
        }
    }

    function activateSearchRow(index) {
        const rows = getSearchRows();
        const el = rows[index];

        if (!el) return;

        searchPendingFocus = { slug: el.dataset?.slug || null, name: el.dataset?.name || null };

        const btn = el.querySelector('button.button:not(:disabled)');

        if (btn) btn.click();
    }

    if (searchInput && itemList) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const rows = getSearchRows();

                if (rows.length === 0) return;

                e.preventDefault();
                searchFocusIndex = (e.key === 'ArrowDown') ? 0 : rows.length - 1;
                refreshSearchListRovingTabindex();
                focusSearchRow(searchFocusIndex, true);
            }
        });
    }

    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            renderItems();
            searchInput.focus();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderItems();
        });

        searchInput.setAttribute('role', 'combobox');
        searchInput.setAttribute('aria-autocomplete', 'list');
        searchInput.setAttribute('aria-haspopup', 'listbox');
        searchInput.setAttribute('aria-controls', 'item-list');
        searchInput.setAttribute('aria-expanded', 'false');
    }

    categoryFilter.addEventListener('change', renderItems);
    fetchItems();

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
                renderItems(); // Ensure results are cleared and empty hint is shown
                searchInput.focus();
            }
        }
    });

    // Arrow-key navigation: from search box into results
    if (searchInput && itemList) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const rows = getSearchRows();
                if (rows.length === 0) return;
                e.preventDefault();
                searchFocusIndex = (e.key === 'ArrowDown') ? 0 : rows.length - 1;
                refreshSearchListRovingTabindex();
                focusSearchRow(searchFocusIndex, true);
            }
        });
    }
    if (itemList) {
        itemList.addEventListener('keydown', (e) => {
            const rows = getSearchRows();
            if (rows.length === 0) return;
            if (searchFocusIndex < 0) {
                const idx = rows.findIndex(li => li === document.activeElement);
                searchFocusIndex = idx >= 0 ? idx : 0;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                focusSearchRow(searchFocusIndex + 1, true);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                focusSearchRow(searchFocusIndex - 1, true);
            } else if (e.key === 'Home') {
                e.preventDefault();
                focusSearchRow(0, true);
            } else if (e.key === 'End') {
                e.preventDefault();
                focusSearchRow(rows.length - 1, true);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                activateSearchRow(searchFocusIndex);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (searchInput) searchInput.focus();
            }
        });
        itemList.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li || li.classList.contains('empty-hint')) return;
            const rows = getSearchRows();
            const idx = rows.indexOf(li);
            if (idx >= 0) {
                searchFocusIndex = idx;
                refreshSearchListRovingTabindex();
            }
        });
    }
}
