import { initAuth } from './modules/auth.js';
import { initUI } from './modules/ui.js';
import { initLists } from './modules/lists.js';
import { initItems } from './modules/items.js';
import { initUtils } from './modules/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Modularized app initialization
    initUtils();
    initAuth();
    initUI();
    initLists();
    initItems();
});

// All authentication, shopping list, item, and keyboard navigation logic is now handled in modules.
