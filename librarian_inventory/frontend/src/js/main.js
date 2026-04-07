/**
 * Main JavaScript Entry Point
 * This file initializes the application and manages core state and view switching
 */

// Global state variables
let inventory = {}; // Stores all inventory items
let bins = ["Bin-A", "Bin-B", "Bin-C", "Bin-D"]; // Available storage bins
let binPointer = 0; // Points to the next bin to assign
let currentView = 'list'; // Tracks the active view

/**
 * Initialize the application when DOM is fully loaded
 * Loads saved data from localStorage and sets up event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Chaos Librarian Inventory System Initialized');

    // Load saved data from browser's local storage
    loadFromStorage();

    // Render the initial view
    renderListView();
    renderBinStatus();

    // Set up form submission handler for adding items
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);

    // Set up Enter key handler for search
    document.getElementById('searchQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    console.log('✅ Application ready');
});

/**
 * Load inventory and bin pointer from localStorage
 * This ensures data persists between browser sessions
 */
function loadFromStorage() {
    // Retrieve saved inventory from localStorage
    const savedInventory = localStorage.getItem('chaosInventory');
    if (savedInventory) {
        try {
            inventory = JSON.parse(savedInventory);
            console.log(`📦 Loaded ${Object.keys(inventory).length} items from storage`);
        } catch (error) {
            console.error('❌ Error loading inventory:', error);
            inventory = {};
        }
    }

    // Retrieve saved bin pointer from localStorage
    const savedPointer = localStorage.getItem('binPointer');
    if (savedPointer) {
        binPointer = parseInt(savedPointer);
        console.log(`📍 Loaded bin pointer: ${bins[binPointer]}`);
    }
}

/**
 * Save inventory to localStorage
 * Called whenever inventory data changes
 */
function saveToStorage() {
    try {
        localStorage.setItem('chaosInventory', JSON.stringify(inventory));
        localStorage.setItem('binPointer', binPointer.toString());
        console.log('💾 Data saved to storage');
    } catch (error) {
        console.error('❌ Error saving to storage:', error);
        showMessage('Error saving data', 'error');
    }
}

/**
 * Switch between different views (add, find, list)
 * @param {string} view - The view to switch to ('add', 'find', or 'list')
 */
function switchView(view) {
    console.log(`🔄 Switching to ${view} view`);

    // Hide all view contents
    document.querySelectorAll('.view-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Remove active state from all tabs
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('bg-purple-600', 'bg-blue-600', 'bg-green-600', 'text-white');
        tab.classList.add('bg-gray-100', 'text-gray-700');
    });

    // Show selected view and activate its tab
    currentView = view;
    const viewElement = document.getElementById(`view-${view}`);
    const tabElement = document.getElementById(`tab-${view}`);

    if (viewElement && tabElement) {
        viewElement.classList.remove('hidden');

        // Apply different colors for different views
        tabElement.classList.remove('bg-gray-100', 'text-gray-700');
        if (view === 'add') {
            tabElement.classList.add('bg-purple-600', 'text-white');
        } else if (view === 'find') {
            tabElement.classList.add('bg-blue-600', 'text-white');
        } else if (view === 'list') {
            tabElement.classList.add('bg-green-600', 'text-white');
            renderListView(); // Refresh list when switching to it
        }
    }

    // Update next bin display if on add view
    if (view === 'add') {
        updateNextBinDisplay();
    }
}

/**
 * Update the display showing which bin will be assigned next
 */
function updateNextBinDisplay() {
    const nextBinElement = document.getElementById('nextBinDisplay');
    if (nextBinElement) {
        nextBinElement.textContent = bins[binPointer];
    }
}

/**
 * Display a message to the user
 * @param {string} message - The message text to display
 * @param {string} type - The message type ('success', 'error', or 'info')
 * @param {number} duration - How long to show the message in milliseconds
 */
function showMessage(message, type = 'info', duration = 3000) {
    const messageBox = document.getElementById('messageBox');

    // Remove existing classes
    messageBox.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50 animate-slide-in';

    // Add type-specific styling
    if (type === 'success') {
        messageBox.classList.add('message-success');
    } else if (type === 'error') {
        messageBox.classList.add('message-error');
    } else {
        messageBox.classList.add('message-info');
    }

    // Set message icon based on type
    let icon = '💡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    messageBox.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-2xl">${icon}</span>
            <span class="font-medium">${message}</span>
        </div>
    `;

    // Show the message
    messageBox.classList.remove('hidden');

    // Auto-hide after duration
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, duration);
}

/**
 * Handle form submission for adding new items
 * @param {Event} e - The form submit event
 */
function handleAddItem(e) {
    e.preventDefault(); // Prevent form from actually submitting

    // Get input values
    const itemName = document.getElementById('itemName').value.trim();
    const itemTags = document.getElementById('itemTags').value.trim();

    // Validate item name
    if (!itemName) {
        showMessage('Please enter an item name', 'error');
        return;
    }

    // Check if item already exists
    if (inventory[itemName]) {
        showMessage('Item already exists in inventory', 'error');
        return;
    }

    // Get the bin to assign
    const assignedBin = bins[binPointer];

    // Parse tags from comma-separated input
    const parsedTags = itemTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

    // Add item to inventory
    inventory[itemName] = {
        bin: assignedBin,
        tags: parsedTags
    };

    console.log(`➕ Added item: ${itemName} to ${assignedBin}`);

    // Move to next bin (rotates back to first after last)
    binPointer = (binPointer + 1) % bins.length;

    // Save to localStorage
    saveToStorage();

    // Show success message
    showMessage(`✓ Stored '${itemName}' in ${assignedBin}`, 'success');

    // Clear form inputs
    document.getElementById('itemName').value = '';
    document.getElementById('itemTags').value = '';

    // Update displays
    updateNextBinDisplay();
    renderBinStatus();

    // Focus back on item name input for quick entry
    document.getElementById('itemName').focus();
}

/**
 * Handle search functionality
 * Searches inventory by item name or tags
 */
function handleSearch() {
    const query = document.getElementById('searchQuery').value.trim().toLowerCase();

    // Validate search query
    if (!query) {
        showMessage('Please enter a search term', 'error');
        return;
    }

    console.log(`🔍 Searching for: ${query}`);

    // Find matching items
    const results = [];

    for (const [name, details] of Object.entries(inventory)) {
        // Check if query matches name or any tag
        if (
            name.toLowerCase().includes(query) ||
            details.tags.some(tag => tag.includes(query))
        ) {
            results.push([name, details]);
        }
    }

    console.log(`📊 Found ${results.length} results`);

    // Display results
    displaySearchResults(results, query);
}

/**
 * Display search results in the find view
 * @param {Array} results - Array of [name, details] tuples
 * @param {string} query - The search query used
 */
function displaySearchResults(results, query) {
    const container = document.getElementById('searchResults');

    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="text-xl font-medium text-gray-500 mt-4">No items match "${query}"</p>
                <p class="text-gray-400 mt-2">Try a different search term</p>
            </div>
        `;
        showMessage('No items match that query', 'info');
        return;
    }

    // Build HTML for results
    let html = `
        <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-700">
                <i class="fas fa-check-circle text-green-500"></i>
                Found ${results.length} item(s) matching "${query}"
            </h3>
        </div>
        <div class="space-y-3">
    `;

    results.forEach(([name, details]) => {
        const tagsHtml = details.tags.length > 0
            ? details.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="text-gray-400 text-sm">No tags</span>';

        html += `
            <div class="item-card bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 text-lg mb-2">${name}</h4>
                        <div class="flex items-center gap-4 text-sm flex-wrap">
                            <div class="flex items-center gap-2 text-blue-600">
                                <i class="fas fa-location-dot"></i>
                                <span class="font-medium">${details.bin}</span>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <i class="fas fa-tags text-gray-400"></i>
                                ${tagsHtml}
                            </div>
                        </div>
                    </div>
                    <button
                        onclick="deleteItem('${name}')"
                        class="text-red-500 hover:text-red-700 transition p-2 hover:bg-red-50 rounded"
                        title="Delete item"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render the complete list of all inventory items
 */
function renderListView() {
    const container = document.getElementById('inventoryList');
    const items = Object.entries(inventory);

    // Show empty state if no items
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p class="text-xl font-medium text-gray-500 mt-4">Library is empty</p>
                <p class="text-gray-400 mt-2">Add your first item to get started</p>
            </div>
        `;
        return;
    }

    // Build HTML for all items
    let html = `
        <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-700">
                <i class="fas fa-archive text-green-500"></i>
                Total Items: ${items.length}
            </h3>
        </div>
        <div class="space-y-3">
    `;

    items.forEach(([name, details]) => {
        const tagsHtml = details.tags.length > 0
            ? details.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="text-gray-400 text-sm">No tags</span>';

        html += `
            <div class="item-card bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 text-lg mb-2">${name}</h4>
                        <div class="flex items-center gap-4 text-sm flex-wrap">
                            <div class="flex items-center gap-2 text-blue-600">
                                <i class="fas fa-location-dot"></i>
                                <span class="font-medium">${details.bin}</span>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <i class="fas fa-tags text-gray-400"></i>
                                ${tagsHtml}
                            </div>
                        </div>
                    </div>
                    <button
                        onclick="deleteItem('${name}')"
                        class="text-red-500 hover:text-red-700 transition p-2 hover:bg-red-50 rounded"
                        title="Delete item"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Delete an item from the inventory
 * @param {string} itemName - Name of the item to delete
 */
function deleteItem(itemName) {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
        return;
    }

    console.log(`🗑️ Deleting item: ${itemName}`);

    // Remove from inventory
    delete inventory[itemName];

    // Save changes
    saveToStorage();

    // Show success message
    showMessage(`Deleted '${itemName}' from inventory`, 'success');

    // Refresh the current view
    if (currentView === 'list') {
        renderListView();
    } else if (currentView === 'find') {
        handleSearch();
    }

    // Update bin status
    renderBinStatus();
}

/**
 * Render the bin status display showing item counts
 */
function renderBinStatus() {
    const container = document.getElementById('binStatus');

    let html = '';

    bins.forEach((bin, index) => {
        // Count items in this bin
        const itemCount = Object.values(inventory).filter(
            item => item.bin === bin
        ).length;

        const isNext = index === binPointer;

        html += `
            <div class="${isNext ? 'bin-badge active' : 'bg-gray-50 border border-gray-200'} p-4 rounded-lg text-center transition transform hover:scale-105">
                <div class="font-semibold text-gray-800 mb-1 flex items-center justify-center gap-2">
                    <i class="fas fa-box"></i>
                    ${bin}
                </div>
                <div class="text-sm text-gray-600 mb-1">
                    ${itemCount} item${itemCount !== 1 ? 's' : ''}
                </div>
                ${isNext ? '<div class="text-xs font-medium mt-2">⭐ Next Assignment</div>' : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

// Log that main.js has loaded
console.log('📄 main.js loaded successfully');
