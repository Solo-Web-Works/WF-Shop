// DOM utility functions and UI sync logic migrated from index.html
export function initDomUtils() {
  // Sync active list name in header
  function syncActiveListName() {
    const tabs = document.getElementById('shopping-list-tabs');
    const nameEl = document.getElementById('active-list-name');
    if (!tabs || !nameEl) return;
    const active = tabs.querySelector('li.active');
    if (active) nameEl.textContent = '- ' + active.textContent.trim();
  }

  // Sync item list height to shopping lists panel
  function syncItemListHeight() {
    const shoppingListsPanel = document.getElementById('shopping-lists-panel');
    const itemList = document.getElementById('item-list');
    if (!shoppingListsPanel || !itemList) return;
    const panelHeight = shoppingListsPanel.offsetHeight;
    itemList.style.maxHeight = panelHeight + 'px';
  }

  // List switcher logic
  const THRESHOLD = 4;
  function buildSwitcher() {
    const tabs = document.getElementById('shopping-list-tabs');
    const sw = document.getElementById('list-switcher');
    const sel = document.getElementById('list-select');
    if (!tabs || !sw || !sel) return;
    const lis = Array.from(tabs.querySelectorAll('li'));
    sel.innerHTML = lis.map(li => {
      const label = li.textContent.trim();
      // Escape label for option
      const safeLabel = String(label)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      const selected = li.classList.contains('active') ? 'selected' : '';
      return `<option ${selected}>${safeLabel}</option>`;
    }).join('');
    sw.hidden = (lis.length < THRESHOLD) && window.matchMedia('(max-width: 50rem)').matches ? true : false;
  }
  function wireSwitcher() {
    const tabs = document.getElementById('shopping-list-tabs');
    const sel = document.getElementById('list-select');
    if (!tabs || !sel) return;
    sel.addEventListener('change', () => {
      const target = Array.from(tabs.querySelectorAll('li')).find(li => li.textContent.trim() === sel.value);
      if (target) target.click();
    });
  }
  function syncSwitcherToActive() {
    const sel = document.getElementById('list-select');
    const active = document.querySelector('#shopping-list-tabs li.active');
    if (sel && active) sel.value = active.textContent.trim();
  }

  // Dialog logic for new list
  function initNewListDialog() {
    const dlg = document.getElementById('new-list-dialog');
    const btn = document.getElementById('create-list-btn');
    const modalInput = document.getElementById('new-list-name-modal');
    const hiddenInput = document.getElementById('new-list-name');
    if (!dlg || !btn || !modalInput || !hiddenInput) return;
    btn.addEventListener('click', (e) => {
      if (btn.dataset.bypassDialog === '1') return;
      e.preventDefault();
      modalInput.value = '';
      dlg.showModal();
      modalInput.focus();
    });
    document.getElementById('new-list-cancel')?.addEventListener('click', () => dlg.close());
    document.getElementById('new-list-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modalInput.value.trim();
      if (!name) { modalInput.focus(); return; }
      hiddenInput.value = name;
      btn.dataset.bypassDialog = '1';
      btn.click();
      delete btn.dataset.bypassDialog;
      dlg.close();
    });
    dlg.addEventListener('close', () => btn.focus());
  }

  // Service worker registration
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/wf-list/sw.js').catch(console.error);
      });
    }
  }

  // Initialization wiring
  document.addEventListener('DOMContentLoaded', function() {
    syncActiveListName();
    syncItemListHeight();
    buildSwitcher();
    wireSwitcher();
    initNewListDialog();
    registerServiceWorker();
    // Observe tab changes to keep name current
    const tabs = document.getElementById('shopping-list-tabs');
    if (tabs) {
      const obsTabs = new MutationObserver(syncActiveListName);
      obsTabs.observe(tabs, { attributes: true, childList: true, subtree: true });
      const obs = new MutationObserver(() => {
        buildSwitcher();
        syncSwitcherToActive();
      });
      obs.observe(tabs, { attributes: true, childList: true, subtree: true });
    }
    window.addEventListener('resize', syncItemListHeight);
    const shoppingListsPanel = document.getElementById('shopping-lists-panel');
    if (shoppingListsPanel) {
      const observer = new MutationObserver(syncItemListHeight);
      observer.observe(shoppingListsPanel, { childList: true, subtree: true });
    }
  });
}
