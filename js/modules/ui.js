// UI rendering and event handling
export function initUI() {
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
    setTimeout(updateMobileTabs, 0);
}
