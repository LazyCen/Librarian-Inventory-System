/**
 * Main JavaScript Entry Point
 * This file initializes the application and manages core state and view switching
 */

// Global state variables
let inventory = {}; // Stores all inventory items
let bins = ["Added", "Borrowed", "Returned"]; // Available bin statuses
let binPointer = 0; // Deprecated
let currentView = 'dashboard'; // Tracks the active view
let currentQuery = '';
let activeTagFilter = '';
let activeBinFilter = '';
let sortMode = 'newest';
let editingItemName = null;
let pendingConfirmAction = null;

/**
 * Initialize the application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Librarian Inventory System Initialized');

    // Load saved data from browser's local storage
    loadFromStorage();

    // Render the initial view
    renderListView();
    renderBinStatus();
    renderTagList();
    switchView('dashboard');
    updateFilterButtonLabel();

    // Set up form submission handler for adding items
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !document.getElementById('addItemModal')?.classList.contains('hidden')) {
            closeAddItemModal();
            return;
        }
        if (event.key === 'Escape' && !document.getElementById('confirmModal')?.classList.contains('hidden')) {
            closeConfirmModal();
        }
    });

    const confirmOverlay = document.getElementById('confirmModal');
    if (confirmOverlay) {
        confirmOverlay.addEventListener('click', (event) => {
            if (event.target === confirmOverlay) {
                closeConfirmModal();
            }
        });
    }

    console.log('Application ready');
});

function loadFromStorage() {
    const savedInventory = localStorage.getItem('chaosInventory');
    if (savedInventory) {
        try {
            inventory = JSON.parse(savedInventory);

            // Data Migration: Ensure all items have necessary fields
            let migrated = false;
            Object.keys(inventory).forEach(name => {
                const item = inventory[name];
                if (!item.id) {
                    item.id = generateUniqueId();
                    migrated = true;
                }
                if (item.author === undefined) {
                    item.author = '';
                    migrated = true;
                }
                if (!item.tags) {
                    item.tags = [];
                    migrated = true;
                }
                if (item.isBorrowed === undefined) {
                    item.isBorrowed = false;
                    migrated = true;
                }
                if (item.borrower === undefined) {
                    item.borrower = '';
                    migrated = true;
                }
                if (item.bin && item.bin.startsWith('Bin-')) {
                    item.bin = item.isBorrowed ? 'Borrowed' : 'Added';
                    migrated = true;
                }
            });

            if (migrated) saveToStorage();
        } catch (error) {
            console.error('Error loading inventory:', error);
            inventory = {};
        }
    }

    const savedPointer = localStorage.getItem('binPointer');
    if (savedPointer) {
        binPointer = parseInt(savedPointer);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('chaosInventory', JSON.stringify(inventory));
        localStorage.setItem('binPointer', binPointer.toString());
    } catch (error) {
        console.error('Error saving to storage:', error);
        showMessage('Error saving data', 'error');
    }
}

/**
 * Calculate multi-dimensional statistics about the current inventory
 * @returns {Object} { tagCounts: {}, statusCounts: {}, totalBooks: number }
 */
function getInventoryStats() {
    const stats = {
        tagCounts: {},
        statusCounts: {
            'Added': 0,
            'Borrowed': 0,
            'Returned': 0
        },
        totalBooks: 0
    };

    const items = Object.values(inventory);
    stats.totalBooks = items.length;

    items.forEach(item => {
        // Tag stats
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1;
            });
        }

        // Status stats
        const bin = item.bin || (item.isBorrowed ? 'Borrowed' : 'Added');
        if (stats.statusCounts.hasOwnProperty(bin)) {
            stats.statusCounts[bin]++;
        } else {
            stats.statusCounts['Added']++;
        }
    });

    return stats;
}

/**
 * Switch between different views
 * @param {string} view - The view to switch to
 */
function switchView(view) {
    console.log(`Switching to ${view} view`);

    // Hide all view contents
    document.querySelectorAll('.view-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Handle sidebar active states
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // Update sidebar active link
    const navMapping = {
        list: 'Books',
        bins: 'Bins Status',
        dashboard: 'Dashboard',
        borrowed: 'Borrowed Books'
    };
    const activeNavText = navMapping[view] || 'Inventory';
    document.querySelectorAll('.nav-item[data-view]').forEach(nav => {
        if (nav.dataset.view === view) {
            nav.classList.add('active');
        }
    });

    // Show selected view
    currentView = view;
    const viewElement = document.getElementById(`view-${view}`);
    if (viewElement) {
        viewElement.classList.remove('hidden');
        viewElement.classList.add('fade-in');
    }

    // Handle sort button visibility
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        if (view === 'dashboard' || view === 'bins') {
            filterBtn.classList.add('hidden');
        } else {
            filterBtn.classList.remove('hidden');
        }
    }

    // Update Title
    const titleElement = document.getElementById('currentViewTitle');
    if (titleElement) {
        titleElement.textContent = activeNavText || 'Inventory';
    }

    if (view === 'list') renderListView(getFilteredEntries(), currentQuery);
    if (view === 'bins') renderBinStatus();
    if (view === 'dashboard') renderDashboardView();
    if (view === 'borrowed') renderBorrowedView();

    // Update next bin display
    updateNextBinDisplay();

    // Refresh users panel status
    if (typeof renderUsersPanel === 'function') renderUsersPanel();
}

/**
 * Render the detailed dashboard view with stats and chart
 */
function renderDashboardView() {
    const stats = getInventoryStats();
    const totalBooks = stats.totalBooks;
    const { tagCounts, statusCounts } = stats;

    const statusData = Object.entries(statusCounts).filter(([, count]) => count > 0);
    const totalTransactions = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    // Update Stats Cards
    const totalBooksEl = document.getElementById('dashTotalBooks');
    if (totalBooksEl) totalBooksEl.textContent = totalBooks.toLocaleString();

    const totalTagsEl = document.getElementById('dashTotalTags');
    if (totalTagsEl) totalTagsEl.textContent = Object.keys(tagCounts).length;

    const totalBinsEl = document.getElementById('dashTotalBins');
    if (totalBinsEl) totalBinsEl.textContent = bins.length;

    const recentItemsEl = document.getElementById('dashRecentItems');
    if (recentItemsEl) {
        const recentCount = Object.values(inventory).filter(item => isRecentDate(item.dateAdded)).length;
        recentItemsEl.textContent = recentCount;
    }

    // Render Donut Chart & List
    renderDonutChart(statusData, totalTransactions);

    // Render Dashboard Borrowed List
    renderDashboardBorrowedList();
}

/**
 * Render an SVG Donut Chart and its legend
 */
function renderDonutChart(data, total) {
    const svg = document.getElementById('dashDonutChart');
    const list = document.getElementById('dashCategoryList');
    if (!svg || !list) return;

    svg.innerHTML = '';
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<p class="text-gray-400">Add books with categories to see distribution.</p>';
        document.getElementById('donutCenterText').textContent = 'No tags yet';
        document.getElementById('donutCenterSub').textContent = 'Start by adding your first title';
        return;
    }

    const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f97316']; // Blue, Green, Red, Orange
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;
    
    // Icon mapping for center display
    const statusIcons = {
        'Added': '<i class="fas fa-circle-plus" style="color: #3b82f6;"></i>',
        'Borrowed': '<i class="fas fa-hand-holding-hand" style="color: #f59e0b;"></i>',
        'Returned': '<i class="fas fa-undo" style="color: #10b981;"></i>'
    };

    data.forEach(([label, count], i) => {
        const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
        const dashArray = (count / total) * circumference;

        // SVG Segment
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("class", "donut-segment");
        circle.setAttribute("cx", "100");
        circle.setAttribute("cy", "100");
        circle.setAttribute("r", radius.toString());
        circle.setAttribute("stroke", colors[i % colors.length]);
        circle.setAttribute("stroke-dasharray", `${dashArray} ${circumference - dashArray}`);
        circle.setAttribute("stroke-dashoffset", (-currentOffset).toString());
        svg.appendChild(circle);

        currentOffset += dashArray;

        // List Item
        const color = colors[i % colors.length];
        list.innerHTML += `
            <div class="category-item clickable" onclick="filterByBin('${label}')">
                <div class="category-info">
                    <div class="category-bullet" style="background: ${color}"></div>
                    <div class="category-details">
                        <span class="category-name">${label}</span>
                        <span class="category-sub">${count.toLocaleString()} Titles</span>
                    </div>
                </div>
                <div class="category-percent">${percent}%</div>
            </div>
        `;

        // Update Center text and icon to top status
        if (i === 0) {
            const iconEl = document.getElementById('donutCenterIcon');
            if (iconEl) iconEl.innerHTML = statusIcons[label] || '<i class="fas fa-arrows-rotate"></i>';
            
            document.getElementById('donutCenterText').textContent = label;
            document.getElementById('donutCenterSub').textContent = `${percent}% - ${count.toLocaleString()} Titles`;
        }
    });
}

/**
 * Render a simplified list of borrowed books for the dashboard
 */
function renderDashboardBorrowedList() {
    const container = document.getElementById('dashBorrowedList');
    if (!container) return;

    const borrowedItems = Object.entries(inventory).filter(([, details]) => details.isBorrowed);

    if (borrowedItems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted); border: 2px dashed #f1f5f9; border-radius: 12px;">
                <i class="fas fa-check-circle" style="font-size: 2rem; color: #22c55e; margin-bottom: 12px; opacity: 0.5;"></i>
                <p>No books currently borrowed. Everything is in stock!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
            ${borrowedItems.map(([name, details]) => {
        const bookId = details.id || 'N/A';
        return `
                    <div class="dash-borrowed-item" style="display: flex; align-items: center; gap: 16px; padding: 16px; background: #fff; border: 1px solid var(--border-color); border-radius: 12px; transition: all 0.2s ease;">
                        <div style="width: 48px; height: 48px; min-width: 48px; background: #fffbeb; color: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
                            #${bookId}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${name}</div>
                            <div style="font-size: 0.8rem; color: #000; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                                <i class="fas fa-user-tag" style="font-size: 0.7rem; color: #f59e0b;"></i> ${details.borrower || 'Unknown Borrower'}
                            </div>
                        </div>
                        <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="openEditItemModal('${name.replace(/'/g, "\\'")}')">
                            Manage
                        </button>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function updateNextBinDisplay() {
    // Deprecated for the new Bin selection system
}

/**
 * Toggles the borrower name field based on whether the borrowed checkbox is checked
 */
function toggleBorrowerField() {
    const select = document.getElementById('itemBinSelection');
    const isBorrowed = select && select.value === 'Borrowed';
    const isReturned = select && select.value === 'Returned';
    
    const borrowerGroup = document.getElementById('borrowerFieldGroup');
    const borrowerInput = document.getElementById('itemBorrower');
    if (borrowerGroup) {
        if (isBorrowed) {
            borrowerGroup.classList.remove('hidden');
        } else {
            borrowerGroup.classList.add('hidden');
            if (borrowerInput) borrowerInput.value = ''; // Clear if unchecking
        }
    }
    
    const returnerGroup = document.getElementById('returnerFieldGroup');
    const returnerInput = document.getElementById('itemReturner');
    if (returnerGroup) {
        if (isReturned) {
            returnerGroup.classList.remove('hidden');
        } else {
            returnerGroup.classList.add('hidden');
            if (returnerInput) returnerInput.value = ''; // Clear if unchecking
        }
    }
}

function setItemFormMode(mode = 'add', itemName = '') {
    const modalTitle = document.getElementById('itemModalTitle');
    const submitBtn = document.getElementById('itemSubmitBtn');

    const isEditMode = mode === 'edit';
    editingItemName = isEditMode ? itemName : null;

    if (modalTitle) {
        modalTitle.textContent = isEditMode ? 'Update Book' : 'Add New Document';
    }

    if (submitBtn) {
        submitBtn.innerHTML = isEditMode
            ? '<i class="fas fa-pen"></i> Save Changes'
            : 'Add to Catalog';
    }
    
    // reset selection to default when adding
    if (!isEditMode) {
        const binSelect = document.getElementById('itemBinSelection');
        if (binSelect) binSelect.value = 'Added';
        toggleBorrowerField();
    }
}

function showMessage(message, type = 'info', duration = 3000) {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    messageBox.className = `fade-in msg-${type}`;
    messageBox.innerText = message;
    messageBox.classList.remove('hidden');

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, duration);
}

function openConfirmModal(message, onConfirm) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    if (!confirmModal || !confirmMessage) return;
    confirmMessage.innerText = message;
    pendingConfirmAction = typeof onConfirm === 'function' ? onConfirm : null;
    confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    if (!confirmModal) return;
    confirmModal.classList.add('hidden');
    pendingConfirmAction = null;
}

function confirmModalAccept() {
    const action = pendingConfirmAction;
    closeConfirmModal();
    if (typeof action === 'function') {
        action();
    }
}

function handleAddItem(e) {
    e.preventDefault();

    const itemName = document.getElementById('itemName').value.trim();
    const itemAuthor = document.getElementById('itemAuthor').value.trim();
    const itemTags = document.getElementById('itemTags').value.trim();
    const binSelect = document.getElementById('itemBinSelection');
    const selectedBin = binSelect ? binSelect.value : 'Added';
    const isBorrowed = selectedBin === 'Borrowed';
    const itemBorrower = document.getElementById('itemBorrower').value.trim();
    const itemReturnerInput = document.getElementById('itemReturner');
    const itemReturner = itemReturnerInput ? itemReturnerInput.value.trim() : '';

    if (!itemName) {
        showMessage('Please enter a book title', 'error');
        return;
    }

    if (!editingItemName && inventory[itemName]) {
        showMessage('Title already exists in catalog', 'error');
        return;
    }

    const parsedTags = itemTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

    if (editingItemName) {
        if (itemName !== editingItemName && inventory[itemName]) {
            showMessage('Another title already uses that name', 'error');
            return;
        }

        const existingData = inventory[editingItemName];
        if (!existingData) {
            showMessage('Original title not found', 'error');
            setItemFormMode('add');
            return;
        }

        delete inventory[editingItemName];
        inventory[itemName] = {
            ...existingData,
            author: itemAuthor,
            bin: selectedBin,
            tags: parsedTags,
            isBorrowed: isBorrowed,
            borrower: isBorrowed ? itemBorrower : '',
            returner: selectedBin === 'Returned' ? itemReturner : ''
        };
        showMessage(`Updated "${itemName}"`, 'success');
    } else {
        const assignedBin = selectedBin;
        const newId = generateUniqueId();
        inventory[itemName] = {
            id: newId,
            author: itemAuthor,
            bin: assignedBin,
            tags: parsedTags,
            isBorrowed: isBorrowed,
            borrower: isBorrowed ? itemBorrower : '',
            returner: selectedBin === 'Returned' ? itemReturner : '',
            dateAdded: new Date().toISOString()
        };
        showMessage(`Catalog updated: '${itemName}' (#${newId}) marked as ${assignedBin}`, 'success');
    }

    saveToStorage();
    setItemFormMode('add');

    // Clear and close
    document.getElementById('addItemForm').reset();
    if (typeof closeAddItemModal === 'function') closeAddItemModal();

    // Refresh
    renderListView();
    renderBinStatus();
    renderTagList();
    renderDashboardView();
    updateFilterButtonLabel();
}

/**
 * Handle search functionality
 */
function handleSearch() {
    const query = document.getElementById('searchQuery').value.trim().toLowerCase();
    currentQuery = query;
    const results = getFilteredEntries();
    if (query && currentView !== 'list') {
        switchView('list');
        return;
    }
    renderListView(results, query);
}

/**
 * Render the complete list of all inventory items
 * Updated to match RegTech card design
 */
function renderListView(itemsToRender = null, query = "", targetContainerId = 'inventoryList', targetCountId = 'itemCount') {
    const container = document.getElementById(targetContainerId);
    const countElement = document.getElementById(targetCountId);
    if (!container) return;

    const items = itemsToRender || getFilteredEntries();
    if (countElement) countElement.textContent = `${items.length} Titles`;

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
                <i class="fas fa-box-open" style="font-size: 3rem; opacity: 0.2; margin-bottom: 16px;"></i>
                <p>No catalog titles found matching "${query}"</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(([name, details]) => {
        const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const date = formatDisplayDate(details.dateAdded);
        const categoryCount = details.tags.length;
        const tagBadges = details.tags.length > 0
            ? details.tags.slice(0, 3).map((tag) => `<span class="card-side-tag">${tag}</span>`).join('')
            : '<span class="card-side-tag muted">uncategorized</span>';

        const authorHtml = details.author ? `<div class="card-author">by ${details.author}</div>` : '';
        
        let actionHtml = '';
        if (details.isBorrowed && details.borrower) {
            actionHtml = `<div class="card-meta" style="color: #000; font-weight: 600;"><i class="fas fa-user-tag" style="color: #f59e0b;"></i> Borrowed by: ${details.borrower}</div>`;
        } else if (details.bin === 'Returned' && details.returner) {
            actionHtml = `<div class="card-meta" style="color: #000; font-weight: 600;"><i class="fas fa-undo" style="color: #22c55e;"></i> Returned by: ${details.returner}</div>`;
        }
        
        const borrowedBadge = details.isBorrowed ? '<span class="borrowed-badge">BORROWED</span>' : '';
        const bookId = details.id || 'N/A';

        return `
            <div class="item-card ${details.isBorrowed ? 'borrowed-item' : ''}">
                <div class="card-options" onclick="openEditItemModal('${safeName}')">
                    <i class="fas fa-pen"></i>
                </div>
                <div class="card-icon">#${bookId}</div>
                <div class="card-updates">Catalog record ${borrowedBadge}</div>
                <h4 class="card-title">${name}</h4>
                ${authorHtml}
                <div class="card-body-row">
                    <div class="card-main-meta">
                        <div class="card-meta"><i class="far fa-calendar"></i> Added ${date}</div>
                        <div class="card-meta"><i class="fas fa-box"></i> Bin/Status: ${details.bin}</div>
                        <div class="card-meta"><i class="fas fa-tags"></i> ${categoryCount} categories</div>
                        ${actionHtml}
                    </div>
                    <div class="card-side-tags">
                        ${tagBadges}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color);">
                    <button class="btn-secondary" style="padding: 8px 10px; font-size: 0.8rem;" onclick="openEditItemModal('${safeName}')">
                        <i class="fas fa-pen"></i> Update
                    </button>
                    <button class="btn-secondary" style="padding: 8px 10px; font-size: 0.8rem; color: #b42318;" onclick="deleteItem('${safeName}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render the tags list in the right sidebar
 */
function renderTagList() {
    const container = document.getElementById('tagList');
    const totalUpdatesElement = document.getElementById('totalUpdates');
    if (!container) return;

    const { tagCounts } = getInventoryStats();
    const tags = Object.keys(tagCounts).sort();

    if (totalUpdatesElement) {
        totalUpdatesElement.textContent = `${tags.length} Active`;
    }

    if (tags.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No categories defined yet.</p>';
        return;
    }

    container.innerHTML = tags.map(tag => `
        <div class="tag-item ${activeTagFilter === tag ? 'active' : ''}" onclick="filterByTag('${tag}')">
            <div class="tag-name-wrapper">
                <div class="tag-bullet"></div>
                <span class="tag-name">${tag}</span>
            </div>
            <span class="tag-options">${tagCounts[tag]}</span>
        </div>
    `).join('');
}

function filterByTag(tag) {
    activeTagFilter = activeTagFilter === tag ? '' : tag;
    activeBinFilter = '';
    const queryInput = document.getElementById('searchQuery');
    if (queryInput) {
        queryInput.value = activeTagFilter;
        currentQuery = activeTagFilter;
    }
    switchView('list');
    renderListView(getFilteredEntries(), currentQuery);
    renderTagList();
}

function deleteItem(itemName) {
    openConfirmModal(`Remove "${itemName}" from the catalog?`, () => {
        delete inventory[itemName];
        saveToStorage();
        renderListView();
        renderBinStatus();
        renderTagList();
        renderDashboardView();
        showMessage(`Removed "${itemName}"`, 'info', 1800);
    });
}

function openEditItemModal(itemName) {
    const itemData = inventory[itemName];
    if (!itemData) {
        showMessage('Book not found', 'error');
        return;
    }

    const itemNameInput = document.getElementById('itemName');
    const itemAuthorInput = document.getElementById('itemAuthor');
    const itemTagsInput = document.getElementById('itemTags');
    const itemBorrowerInput = document.getElementById('itemBorrower');
    const itemReturnerInput = document.getElementById('itemReturner');
    const binSelect = document.getElementById('itemBinSelection');
    if (!itemNameInput || !itemTagsInput) return;

    setItemFormMode('edit', itemName);
    itemNameInput.value = itemName;
    if (itemAuthorInput) itemAuthorInput.value = itemData.author || '';
    itemTagsInput.value = itemData.tags.join(', ');
    if (binSelect) {
        binSelect.value = itemData.bin || (itemData.isBorrowed ? 'Borrowed' : 'Added');
    }
    if (itemBorrowerInput) itemBorrowerInput.value = itemData.borrower || '';
    if (itemReturnerInput) itemReturnerInput.value = itemData.returner || '';

    // Toggle borrower/returner field visibility
    toggleBorrowerField();

    document.getElementById('addItemModal').classList.remove('hidden');
}

function renderBinStatus() {
    const container = document.getElementById('binStatus');
    if (!container) return;

    container.innerHTML = bins.map((bin) => {
        const itemCount = Object.values(inventory).filter(item => item.bin === bin).length;

        let iconStr = '<i class="fas fa-box"></i>';
        if (bin === 'Added') iconStr = '<i class="fas fa-plus-circle"></i>';
        if (bin === 'Borrowed') iconStr = '<i class="fas fa-hand-holding-hand"></i>';
        if (bin === 'Returned') iconStr = '<i class="fas fa-undo"></i>';

        return `
            <div class="bin-card" onclick="filterByBin('${bin}')">
                <div class="bin-card-header">
                    <div class="bin-card-icon" style="background: none; color: inherit; font-size: 1.5rem;">
                        ${iconStr}
                    </div>
                </div>
                <h4 class="card-title">${bin} Books</h4>
                <div class="card-meta">
                    <i class="fas fa-book"></i> ${itemCount} Titles
                </div>
                <div class="card-details">
                    View titles <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }).join('');
}

function getFilteredEntries() {
    let entries = Object.entries(inventory);
    if (currentQuery) {
        entries = entries.filter(([name, details]) =>
            name.toLowerCase().includes(currentQuery) ||
            (details.tags && details.tags.some(tag => tag.includes(currentQuery))) ||
            (details.id && details.id.toString().includes(currentQuery)) ||
            (details.author && details.author.toLowerCase().includes(currentQuery)) ||
            (details.borrower && details.borrower.toLowerCase().includes(currentQuery))
        );
    }
    if (activeTagFilter) {
        entries = entries.filter(([, details]) => details.tags && details.tags.includes(activeTagFilter));
    }
    if (activeBinFilter) {
        entries = entries.filter(([, details]) => details.bin === activeBinFilter);
    }
    entries = sortEntries(entries);
    return entries;
}

function sortEntries(entries) {
    const sorted = [...entries];
    if (sortMode === 'name') {
        sorted.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortMode === 'oldest') {
        sorted.sort((a, b) => getDateValue(a[1].dateAdded) - getDateValue(b[1].dateAdded));
    } else {
        sorted.sort((a, b) => getDateValue(b[1].dateAdded) - getDateValue(a[1].dateAdded));
    }
    return sorted;
}

function cycleSortMode() {
    const modes = ['newest', 'oldest', 'name'];
    const currentIndex = modes.indexOf(sortMode);
    sortMode = modes[(currentIndex + 1) % modes.length];
    updateFilterButtonLabel();
    renderListView(getFilteredEntries(), currentQuery);
    showMessage(`Sorted by ${sortMode}`, 'info', 1500);
}

function updateFilterButtonLabel() {
    const button = document.getElementById('filterBtn');
    if (!button) return;
    const labels = {
        newest: 'Sort: Newest',
        oldest: 'Sort: Oldest',
        name: 'Sort: Name'
    };
    button.innerHTML = `<i class="fas fa-filter"></i> ${labels[sortMode]}`;
}

function resetFilters() {
    currentQuery = '';
    activeTagFilter = '';
    activeBinFilter = '';
    const queryInput = document.getElementById('searchQuery');
    if (queryInput) queryInput.value = '';
    renderTagList();
    renderListView(getFilteredEntries(), currentQuery);
}

function showAllItems() {
    resetFilters();
    switchView('list');
}

function focusTopTagFromDashboard() {
    const { tagCounts } = getInventoryStats();
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topTag) {
        showMessage('No tags available yet', 'info');
        return;
    }
    filterByTag(topTag);
}

function filterRecentItems() {
    currentQuery = '';
    activeTagFilter = '';
    activeBinFilter = '';
    const recentEntries = Object.entries(inventory).filter(([, details]) => isRecentDate(details.dateAdded));
    switchView('list');
    renderListView(sortEntries(recentEntries), 'recent');
}

function filterByBin(bin) {
    activeBinFilter = bin;
    activeTagFilter = '';
    currentQuery = '';
    const queryInput = document.getElementById('searchQuery');
    if (queryInput) queryInput.value = '';
    switchView('list');
    renderListView(getFilteredEntries(), '');
    showMessage(`Showing titles from ${bin}`, 'info', 1500);
}

function isRecentDate(dateValue) {
    const addedAt = getDateValue(dateValue);
    if (!addedAt) return false;
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return addedAt >= sevenDaysAgo;
}

function getDateValue(dateValue) {
    if (!dateValue) return 0;
    const parsed = Date.parse(dateValue);
    return Number.isNaN(parsed) ? 0 : parsed;
}
function formatDisplayDate(dateValue) {
    const value = getDateValue(dateValue);
    if (!value) return 'No date';
    return new Date(value).toLocaleDateString('en-GB');
}

/**
 * Generate a unique 4-digit ID for a book
 */
function generateUniqueId() {
    let id;
    let attempts = 0;
    const existingIds = Object.values(inventory).map(item => item.id?.toString());

    do {
        id = Math.floor(1000 + Math.random() * 9000).toString();
        attempts++;
    } while (existingIds.includes(id) && attempts < 100);

    return id;
}

/**
 * Render the specifically filtered Borrowed view
 */
function renderBorrowedView() {
    const borrowedItems = Object.entries(inventory).filter(([, details]) => details.isBorrowed);
    renderListView(borrowedItems, "", 'borrowedList', 'borrowedCount');
}

console.log('Main Logic Updated for New Dashboard');
