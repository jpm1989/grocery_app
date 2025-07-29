// Application data and constants
const STORAGE_KEY = 'groceryListItems';
const APP_VERSION = '1.0.0';

const appData = {
  categories: {
    "Fruits": ["Apple", "Banana", "Orange", "Mango", "Grapes", "Pomegranate", "Watermelon", "Pineapple", "Papaya", "Guava", "Other"],
    "Vegetables": ["Onion", "Potato", "Tomato", "Carrot", "Spinach", "Cabbage", "Cauliflower", "Brinjal", "Okra", "Capsicum", "Other"],
    "Non Veg": ["Chicken", "Mutton", "Fish", "Prawns", "Eggs", "Other"],
    "Dairy": ["Milk", "Butter", "Cheese", "Yogurt", "Paneer", "Cream", "Other"],
    "Bakery": ["Bread", "Buns", "Cake", "Cookies", "Pastry", "Other"],
    "Pantry": ["Rice", "Wheat Flour", "Mustard Oil","Rice Bran Oil","Sunflower Oil","Coconut Oil", "Sugar", "Salt", "Spices", "Dal", "Other"],
    "Frozen": ["Ice Cream", "Frozen Vegetables", "Frozen Snacks", "Other"],
    "Beverages": ["Tea", "Coffee", "Juice", "Soft Drinks", "Water", "Other"],
    "Snacks": ["Chips", "Biscuits", "Nuts", "Chocolates", "Other"],
    "Personal Care": ["Soap", "Shampoo", "Toothpaste", "Other"],
    "Household": ["Detergent", "Cleaning Supplies", "Other"],
    "Other": ["Other"]
  },
  units: [
    { value: "pcs", label: "pieces (pcs)" },
    { value: "kg", label: "kilogram (kg)" },
    { value: "g", label: "grams (g)" },
    { value: "l", label: "liters (l)" },
    { value: "ml", label: "milliliters (ml)" },
    { value: "dozen", label: "dozen" },
    { value: "pack", label: "pack" },
    { value: "bottle", label: "bottle" },
    { value: "can", label: "can" },
    { value: "box", label: "box" }
  ]
};

// Application state
let groceryItems = [];
let nextId = 1;

// DOM elements
let categorySelect, itemNameSelect, customItemInput, quantityInput, commentInput, 
    unitSelect, priceInput, priceLabel, totalAmountElement, tableBody, 
    filterCategorySelect, searchInput;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  loadFromStorage();
  populateSelects();
  setupEventListeners();
  updateTotal();
  updatePriceLabel();
  renderTable();
});

function initializeElements() {
  categorySelect = document.getElementById('category');
  itemNameSelect = document.getElementById('item-name');
  customItemInput = document.getElementById('custom-item');
  quantityInput = document.getElementById('quantity');
  commentInput = document.getElementById('comment');
  unitSelect = document.getElementById('unit');
  priceInput = document.getElementById('price');
  priceLabel = document.getElementById('price-label');
  totalAmountElement = document.getElementById('total-amount');
  tableBody = document.getElementById('table-body');
  filterCategorySelect = document.getElementById('filter-category');
  searchInput = document.getElementById('search-item');

  // Validate critical elements
  const criticalElements = {
    categorySelect, itemNameSelect, unitSelect, priceInput, tableBody
  };

  for (const [name, element] of Object.entries(criticalElements)) {
    if (!element) {
      console.error(`Critical element missing: ${name}`);
      return false;
    }
  }

  return true;
}

function populateSelects() {
  // Clear and populate categories
  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    Object.keys(appData.categories).forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }

  // Clear and populate units
  if (unitSelect) {
    unitSelect.innerHTML = '<option value="">Select Unit</option>';
    appData.units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit.value;
      option.textContent = unit.label;
      unitSelect.appendChild(option);
    });
  }

  // Clear and populate filter categories
  if (filterCategorySelect) {
    filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
    Object.keys(appData.categories).forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filterCategorySelect.appendChild(option);
    });
  }

  // Initialize item name select as disabled
  if (itemNameSelect) {
    itemNameSelect.innerHTML = '<option value="">Select Item</option>';
    itemNameSelect.disabled = true;
  }
}

function setupEventListeners() {
  // Form submission with Enter key support
  const itemForm = document.getElementById('item-form');
  if (itemForm) {
    itemForm.addEventListener('submit', handleAddItem);

    // Add keyboard shortcut support
    itemForm.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleAddItem(e);
      }
    });
  }

  // Category change
  if (categorySelect) {
    categorySelect.addEventListener('change', handleCategoryChange);
  }

  // Item name change
  if (itemNameSelect) {
    itemNameSelect.addEventListener('change', handleItemNameChange);
  }

  // Price type change
  const priceTypeRadios = document.querySelectorAll('input[name="price-type"]');
  priceTypeRadios.forEach(radio => {
    radio.addEventListener('change', updatePriceLabel);
  });

  // Clear all
  const clearAllBtn = document.getElementById('clear-all');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearAllItems();
    });
  }

  // Filter
  if (filterCategorySelect) {
    filterCategorySelect.addEventListener('change', renderTable);
  }

  // Search with debouncing
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        renderTable();
      }, 300);
    });
  }

  // Export
  const exportBtn = document.getElementById('export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', function(e) {
      e.preventDefault();
      exportToCSV();
    });
  }
}

function handleCategoryChange() {
  const selectedCategory = categorySelect.value;

  // Clear custom item input
  if (customItemInput) {
    customItemInput.classList.add('hidden');
    customItemInput.required = false;
    customItemInput.value = '';
  }

  if (selectedCategory && appData.categories[selectedCategory]) {
    // Enable and populate item name select
    itemNameSelect.disabled = false;
    itemNameSelect.innerHTML = '<option value="">Select Item</option>';

    appData.categories[selectedCategory].forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      itemNameSelect.appendChild(option);
    });

    // Auto-focus on item select
    setTimeout(() => itemNameSelect.focus(), 100);
  } else {
    // Disable item name select if no category selected
    itemNameSelect.disabled = true;
    itemNameSelect.innerHTML = '<option value="">Select Item</option>';
  }
}

function handleItemNameChange() {
  const selectedItem = itemNameSelect.value;

  if (selectedItem === 'Other') {
    customItemInput.classList.remove('hidden');
    customItemInput.required = true;
    setTimeout(() => customItemInput.focus(), 100);
  } else {
    customItemInput.classList.add('hidden');
    customItemInput.required = false;
    customItemInput.value = '';

    // Auto-focus on quantity if item is selected
    if (selectedItem) {
      setTimeout(() => quantityInput.focus(), 100);
    }
  }
}

function updatePriceLabel() {
  const priceTypeRadio = document.querySelector('input[name="price-type"]:checked');

  if (priceTypeRadio && priceLabel) {
    const priceType = priceTypeRadio.value;
    if (priceType === 'perUnit') {
      priceLabel.textContent = 'Price per Unit (₹) *';
    } else {
      priceLabel.textContent = 'Net Price (₹) *';
    }
  }
}

function validateForm(formData) {
  const { category, itemName, quantity, unit, price } = formData;

  if (!category) {
    showError('Please select a category');
    categorySelect.focus();
    return false;
  }

  if (!itemName || itemName.trim().length === 0) {
    showError('Please select or enter an item name');
    if (itemNameSelect.value === 'Other') {
      customItemInput.focus();
    } else {
      itemNameSelect.focus();
    }
    return false;
  }

  if (!quantity || quantity <= 0) {
    showError('Please enter a valid quantity');
    quantityInput.focus();
    return false;
  }

  if (!unit) {
    showError('Please select a unit');
    unitSelect.focus();
    return false;
  }

  if (!price || price <= 0) {
    showError('Please enter a valid price');
    priceInput.focus();
    return false;
  }

  return true;
}

function showError(message) {
  // Could be enhanced with a toast notification system
  alert(message);
}

function handleAddItem(e) {
  e.preventDefault();
  e.stopPropagation();

  const category = categorySelect.value;
  const selectedItemName = itemNameSelect.value;
  const itemName = selectedItemName === 'Other' ? customItemInput.value.trim() : selectedItemName;
  const quantity = parseFloat(quantityInput.value);
  const comment = commentInput.value.trim();
  const unit = unitSelect.value;
  const priceTypeRadio = document.querySelector('input[name="price-type"]:checked');
  const priceType = priceTypeRadio ? priceTypeRadio.value : 'perUnit';
  const price = parseFloat(priceInput.value);

  const formData = { category, itemName, quantity, unit, price };

  if (!validateForm(formData)) {
    return;
  }

  // Check for duplicates
  const existingItem = groceryItems.find(item => 
    item.category === category && 
    item.itemName.toLowerCase() === itemName.toLowerCase()
  );

  if (existingItem && !confirm(`Item "${itemName}" already exists in ${category}. Add anyway?`)) {
    return;
  }

  // Calculate price per unit for the item
  let pricePerUnit;
  if (priceType === 'perUnit') {
    pricePerUnit = price;
  } else {
    pricePerUnit = price / quantity;
  }

  // Calculate total price for the item
  let totalPrice;
  if (priceType === 'perUnit') {
    totalPrice = price * quantity;
  } else {
    totalPrice = price;
  }

  // Create new item
  const newItem = {
    id: nextId++,
    category,
    itemName,
    quantity,
    comment,
    unit,
    priceType,
    pricePerUnit,
    totalPrice,
    bought: false,
    dateAdded: new Date().toLocaleDateString('en-IN')
  };

  groceryItems.push(newItem);

  // Save to storage
  saveToStorage();

  // Reset form
  resetForm();

  // Update display
  updateTotal();
  renderTable();

  // Focus back to category for next item
  setTimeout(() => categorySelect.focus(), 100);

  // Add highlight animation to new row
  setTimeout(() => {
    const newRow = document.querySelector(`[data-item-id="${newItem.id}"]`);
    if (newRow) {
      newRow.classList.add('item-row--new');
    }
  }, 200);
}

function resetForm() {
  // Reset all form fields
  categorySelect.value = '';
  itemNameSelect.innerHTML = '<option value="">Select Item</option>';
  itemNameSelect.disabled = true;
  customItemInput.classList.add('hidden');
  customItemInput.required = false;
  customItemInput.value = '';
  quantityInput.value = '1';
  commentInput.value = ''; // Fixed missing semicolon
  unitSelect.value = '';
  priceInput.value = '';

  // Reset radio button
  const perUnitRadio = document.querySelector('input[name="price-type"][value="perUnit"]');
  if (perUnitRadio) {
    perUnitRadio.checked = true;
  }
  updatePriceLabel();
}

function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    groceryItems = groceryItems.filter(item => item.id !== id);
    saveToStorage();
    updateTotal();
    renderTable();
  }
}

function toggleBought(id) {
  const item = groceryItems.find(item => item.id === id);
  if (item) {
    item.bought = !item.bought;
    saveToStorage();
    renderTable();
  }
}

function clearAllItems() {
  if (groceryItems.length === 0) {
    showError('No items to clear');
    return;
  }

  if (confirm('Are you sure you want to clear all items? This action cannot be undone.')) {
    groceryItems = [];
    nextId = 1;
    saveToStorage();
    updateTotal();
    renderTable();
    resetForm();
  }
}

function updateTotal() {
  const total = groceryItems.reduce((sum, item) => sum + item.totalPrice, 0);
  if (totalAmountElement) {
    totalAmountElement.textContent = `₹${total.toFixed(2)}`;
  }
}

function getFilteredItems() {
  const filterCategory = filterCategorySelect ? filterCategorySelect.value : 'all';
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filteredItems = groceryItems;

  if (filterCategory !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === filterCategory);
  }

  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      item.itemName.toLowerCase().includes(searchTerm) ||
      item.comment.toLowerCase().includes(searchTerm)
    );
  }

  return filteredItems;
}

function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTable() {
  if (!tableBody) return;

  const filteredItems = getFilteredItems();

  if (filteredItems.length === 0) {
    const emptyMessage = groceryItems.length === 0 
      ? 'No items added yet. Start by selecting a category, item name, and unit above!'
      : 'No items match the current filter criteria.';

    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">${emptyMessage}</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredItems.map(item => {
    const unitLabel = appData.units.find(u => u.value === item.unit)?.label || item.unit;
    return `
      <tr class="item-row ${item.bought ? 'item-row--bought' : ''}" data-item-id="${item.id}">
        <td><span class="category-badge">${sanitizeHTML(item.category)}</span></td>
        <td class="item-name">${sanitizeHTML(item.itemName)}</td>
        <td>${item.quantity}</td>
        <td>${sanitizeHTML(unitLabel)}</td>        
        <td class="price-cell">₹${item.pricePerUnit.toFixed(2)}</td>
        <td class="total-price-cell">₹${item.totalPrice.toFixed(2)}</td>
        <td>${sanitizeHTML(item.comment || '-')}</td>
        <td>${item.dateAdded}</td>
        <td>
          <input type="checkbox" class="checkbox-input" ${item.bought ? 'checked' : ''} 
                 onchange="toggleBought(${item.id})" aria-label="Mark as bought" />
        </td>
        <td>
          <button class="table-btn" onclick="deleteItem(${item.id})" title="Delete item" aria-label="Delete ${sanitizeHTML(item.itemName)}">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function saveToStorage() {
  try {
    const dataToSave = {
      items: groceryItems,
      nextId: nextId,
      lastUpdated: new Date().toISOString(),
      version: APP_VERSION
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    showError('Failed to save data. Your changes may be lost.');
  }
}

function loadFromStorage() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);

      // Validate data structure
      if (parsedData && Array.isArray(parsedData.items)) {
        groceryItems = parsedData.items;
        nextId = parsedData.nextId || 1;

        // Ensure nextId is greater than any existing ID
        if (groceryItems.length > 0) {
          const maxId = Math.max(...groceryItems.map(item => item.id || 0));
          nextId = Math.max(nextId, maxId + 1);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    // Reset to empty state on error
    groceryItems = [];
    nextId = 1;
  }
}

function exportToCSV() {
  if (groceryItems.length === 0) {
    showError('No items to export');
    return;
  }

  const headers = ['Category', 'Item', 'Quantity', 'Unit', 'Price per Unit (₹)', 'Total Price (₹)', 'Comment', 'Date Added', 'Bought'];
  const csvContent = [
    headers.join(','),
    ...groceryItems.map(item => {
      const unitLabel = appData.units.find(u => u.value === item.unit)?.label || item.unit;
      return [
        `"${item.category}"`,
        `"${item.itemName}"`,
        item.quantity,
        `"${unitLabel}"`,
        item.pricePerUnit.toFixed(2),
        item.totalPrice.toFixed(2),
        `"${item.comment || ''}"`,
        `"${item.dateAdded}"`,
        item.bought ? 'Yes' : 'No'
      ].join(',');
    })
  ].join('\n');

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `grocery-list-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    showError('Failed to export data. Please try again.');
  }
}

// Export functions for global access (needed for onclick handlers)
window.deleteItem = deleteItem;
window.toggleBought = toggleBought;