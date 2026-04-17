/**
 * Main JavaScript Entry Point
 * This file initializes the application and manages core state and view switching
 */

// Global state variables
let inventory = {}; // Stores all inventory items
let bins = ["Bin-A", "Bin-B", "Bin-C", "Bin-D"]; // Available storage bins
let binPointer = 0; // Points to the next bin to assign
let currentView = 'dashboard'; // Tracks the active view
let currentQuery = '';
let activeTagFilter = '';
let activeBinFilter = '';
let sortMode = 'newest';

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
        }
    });

    console.log('Application ready');
});

function loadFromStorage() {
    const savedInventory = localStorage.getItem('chaosInventory');
    if (savedInventory) {
        try {
            inventory = JSON.parse(savedInventory);
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
        list: 'Catalog',
        bins: 'Shelves',
        dashboard: 'Overview'
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

    // Update Title
    const titleElement = document.getElementById('currentViewTitle');
    if (titleElement) {
        titleElement.textContent = activeNavText || 'Inventory';
    }

    if (view === 'list') renderListView(getFilteredEntries(), currentQuery);
    if (view === 'bins') renderBinStatus();
    if (view === 'dashboard') renderDashboardView();

    // Update next bin display
    updateNextBinDisplay();
}

/**
 * Render the detailed dashboard view with stats and chart
 */
function renderDashboardView() {
    const totalBooks = Object.keys(inventory).length;
    
    // Calculate tag frequencies for categories
    const tagCounts = {};
    Object.values(inventory).forEach(item => {
        item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4); // Get top 4 categories

    const totalTagUsage = Object.values(tagCounts).reduce((a, b) => a + b, 0);

    // Update Stats Cards
    document.getElementById('dashTotalBooks').textContent = totalBooks.toLocaleString();
    document.getElementById('dashTotalTags').textContent = Object.keys(tagCounts).length;
    document.getElementById('dashTotalBins').textContent = bins.length;
    const recentItems = Object.values(inventory).filter(item => isRecentDate(item.dateAdded)).length;
    document.getElementById('dashRecentItems').textContent = recentItems;

    // Render Donut Chart & List
    renderDonutChart(sortedTags, totalTagUsage);
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

    const colors = ['#101828', '#475467', '#667085', '#98a2b3']; // Grayscale high-end colors
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    data.forEach(([tag, count], i) => {
        const percent = ((count / total) * 100).toFixed(0);
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
            <div class="category-item clickable" onclick="filterByTag('${tag}')">
                <div class="category-info">
                    <div class="category-bullet" style="background: ${color}"></div>
                    <div class="category-details">
                        <span class="category-name">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                        <span class="category-sub">${count.toLocaleString()} Titles</span>
                    </div>
                </div>
                <div class="category-percent">${percent}%</div>
            </div>
        `;

        // Update Center text to top category
        if (i === 0) {
            document.getElementById('donutCenterText').textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
            document.getElementById('donutCenterSub').textContent = `${percent}% - ${count.toLocaleString()} Titles`;
        }
    });
}

function updateNextBinDisplay() {
    const nextBinElement = document.getElementById('nextBinDisplay');
    if (nextBinElement) {
        nextBinElement.textContent = bins[binPointer];
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

function handleAddItem(e) {
    e.preventDefault();

    const itemName = document.getElementById('itemName').value.trim();
    const itemTags = document.getElementById('itemTags').value.trim();

    if (!itemName) {
        showMessage('Please enter a book title', 'error');
        return;
    }

    if (inventory[itemName]) {
        showMessage('Title already exists in catalog', 'error');
        return;
    }

    const assignedBin = bins[binPointer];
    const parsedTags = itemTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

    inventory[itemName] = {
        bin: assignedBin,
        tags: parsedTags,
        dateAdded: new Date().toISOString()
    };

    binPointer = (binPointer + 1) % bins.length;
    saveToStorage();
    showMessage(`Catalog updated: '${itemName}' assigned to ${assignedBin}`, 'success');

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
function renderListView(itemsToRender = null, query = "") {
    const container = document.getElementById('inventoryList');
    const countElement = document.getElementById('itemCount');
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
        // Use first tag for the card status or a default
        const primaryTag = details.tags.length > 0 ? `# ${details.tags[0]}` : '# uncategorized';
        const date = formatDisplayDate(details.dateAdded);
        const categoryCount = details.tags.length;
        
        return `
            <div class="item-card">
                <div class="card-options" onclick="deleteItem('${name}')">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
                <div class="card-icon">BK</div>
                <div class="card-updates">Catalog record</div>
                <h4 class="card-title">${name}</h4>
                <div class="card-meta"><i class="far fa-calendar"></i> Added ${date}</div>
                <div class="card-meta"><i class="fas fa-box"></i> Shelf ${details.bin}</div>
                <div class="card-meta"><i class="fas fa-tags"></i> ${categoryCount} categories</div>
                <div class="card-tag">${primaryTag}</div>
                <div class="card-details">
                    Open record <i class="fas fa-arrow-right"></i>
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

    // Extract unique tags and count items per tag
    const tagCounts = {};
    Object.values(inventory).forEach(item => {
        item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

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
                <span class="tag-name"># ${tag}</span>
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
    if (!confirm(`Remove "${itemName}" from the catalog?`)) return;
    delete inventory[itemName];
    saveToStorage();
    renderListView();
    renderBinStatus();
    renderTagList();
    renderDashboardView();
}

function renderBinStatus() {
    const container = document.getElementById('binStatus');
    if (!container) return;

    container.innerHTML = bins.map((bin, index) => {
        const itemCount = Object.values(inventory).filter(item => item.bin === bin).length;
        const isNext = index === binPointer;

        return `
            <div class="item-card ${isNext ? 'active-bin' : ''} clickable" style="gap: 8px;" onclick="filterByBin('${bin}')">
                <div class="flex justify-between items-center">
                    <div class="card-icon" style="background:#f0443815; color:#f04438;">${bin.split('-')[1]}</div>
                    ${isNext ? '<span class="badge-update">NEXT</span>' : ''}
                </div>
                <h4 class="card-title">${bin}</h4>
                <div class="card-meta">
                    <i class="fas fa-box"></i> ${itemCount} Titles stored
                </div>
                <div class="card-details">View titles</div>
            </div>
        `;
    }).join('');
}

function getFilteredEntries() {
    let entries = Object.entries(inventory);
    if (currentQuery) {
        entries = entries.filter(([name, details]) =>
            name.toLowerCase().includes(currentQuery) ||
            details.tags.some(tag => tag.includes(currentQuery))
        );
    }
    if (activeTagFilter) {
        entries = entries.filter(([, details]) => details.tags.includes(activeTagFilter));
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
    const tagCounts = {};
    Object.values(inventory).forEach((item) => {
        item.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
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

console.log('Main Logic Updated for New Dashboard');
