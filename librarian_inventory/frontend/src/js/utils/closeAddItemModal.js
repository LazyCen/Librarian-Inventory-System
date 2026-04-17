/**
 * Closes the "Add Item" modal overlay by adding the 'hidden' class.
 * This is triggered upon successful item addition or when the user manually closes the modal.
 */
function closeAddItemModal() { 
    document.getElementById('addItemModal').classList.add('hidden'); 
}
