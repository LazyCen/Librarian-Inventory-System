/**
 * Opens the "Add Item" modal overlay by removing its 'hidden' class.
 * This function allows users to upload or add new items/documents to their inventory.
 */
function openAddItemModal() { 
    if (typeof setItemFormMode === 'function') {
        setItemFormMode('add');
    }
    document.getElementById('addItemModal').classList.remove('hidden'); 
}
