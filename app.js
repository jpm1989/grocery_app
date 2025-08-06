// Grocery List Manager Application
class GroceryListManager {
    constructor() {
        this.groceryList = [];
        this.editingIndex = -1;
        this.pendingConfirmAction = null;
        this.categories = {
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
        };
        
        this.units = [
            { "value": "pcs", "label": "pieces (pcs)" },
            { "value": "kg", "label": "kilogram (kg)" },
            { "value": "g", "label": "grams (g)" },
            { "value": "l", "label": "liters (l)" },
            { "value": "ml", "label": "milliliters (ml)" },
            { "value": "dozen", "label": "dozen" },
            { "value": "pack", "label": "pack" },
            { "value": "bottle", "label": "bottle" },
            { "value": "can", "label": "can" },
            { "value": "box", "label": "box" }
        ];

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.populateDropdowns();
        this.setTodayDate();
        this.renderTable();
        this.updateStats();
		this.updatePriceLabel();
		this.setTodayDate();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('grocery-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Category change
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.populateItemDropdown(e.target.value);
            });
        }

        // Search and filters
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterTable());
        }

        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => this.filterTable());
        }

        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterTable());
        }

        // Action buttons
        const clearAllBtn = document.getElementById('clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }

        const allPurchasedBtn = document.getElementById('all-purchased-btn');
        if (allPurchasedBtn) {
            allPurchasedBtn.addEventListener('click', () => this.markAllPurchased());
        }

        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCSV());
        }

        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Modal events
        const modalCancel = document.getElementById('modal-cancel');
        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.hideModal());
        }

        const modalConfirm = document.getElementById('modal-confirm');
        if (modalConfirm) {
            modalConfirm.addEventListener('click', () => this.confirmAction());
        }

        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.hideModal());
        }
		
		const priceTypeRadios = document.querySelectorAll('input[name="price-type"]');
		priceTypeRadios.forEach(radio => {
		radio.addEventListener('change', () => this.updatePriceLabel());
		});
    }

    populateDropdowns() {
        // Populate category dropdown
        const categorySelect = document.getElementById('category');
        const filterCategorySelect = document.getElementById('filter-category');
        
        if (categorySelect) {
            Object.keys(this.categories).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }

        if (filterCategorySelect) {
            Object.keys(this.categories).forEach(category => {
                const filterOption = document.createElement('option');
                filterOption.value = category;
                filterOption.textContent = category;
                filterCategorySelect.appendChild(filterOption);
            });
        }

        // Populate units dropdown
        const unitSelect = document.getElementById('unit');
        if (unitSelect) {
            this.units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit.value;
                option.textContent = unit.label;
                unitSelect.appendChild(option);
            });
        }
    }

    populateItemDropdown(category) {
        const itemSelect = document.getElementById('item');
        if (!itemSelect) return;

        itemSelect.innerHTML = '<option value="">Select Item</option>';
        
        if (category && this.categories[category]) {
            itemSelect.disabled = false;
            this.categories[category].forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                itemSelect.appendChild(option);
            });
        } else {
            itemSelect.disabled = true;
        }
    }

    setTodayDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    handleFormSubmit() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        if (this.editingIndex >= 0) {
            this.updateItem(formData);
        } else {
            this.addItem(formData);
        }

        this.resetForm();
        this.renderTable();
        this.updateStats();
        this.saveData();
    }

    getFormData() {
        const categoryElement = document.getElementById('category');
        const itemElement = document.getElementById('item');
        const customItemElement = document.getElementById('custom-item');
        const quantityElement = document.getElementById('quantity');
        const unitElement = document.getElementById('unit');
        const priceElement = document.getElementById('price');
        const commentElement = document.getElementById('comment');
        const dateElement = document.getElementById('date');

        const customItem = customItemElement ? customItemElement.value.trim() : '';
        const selectedItem = itemElement ? itemElement.value : '';
        const priceValue = priceElement ? priceElement.value : '0';
		const priceTypeElement = document.querySelector('input[name="price-type"]:checked');
    
		//const priceValue = priceElement ? priceElement.value : '0';
		const quantity = quantityElement ? parseFloat(quantityElement.value) || 0 : 0;
		const price = parseFloat(priceValue) || 0;
		const priceType = priceTypeElement ? priceTypeElement.value : 'perUnit';
		// Calculate price per unit and total based on pricing mode
		
		
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
        
        return {
            category: categoryElement ? categoryElement.value : '',
            item: customItem || selectedItem,
            quantity: quantityElement ? parseFloat(quantityElement.value) || 0 : 0,
            unit: unitElement ? unitElement.value : '',
            price: price,
			priceType: priceType,
			pricePerUnit: pricePerUnit,
			totalPrice: totalPrice,
            comment: commentElement ? commentElement.value.trim() : '',
            date: dateElement ? dateElement.value : '',
            bought: false,
            id: this.editingIndex >= 0 ? this.groceryList[this.editingIndex].id : Date.now()
        };
    }

    validateForm(data) {
        if (!data.category) {
            alert('Please select a category.');
            return false;
        }

        if (!data.item) {
            alert('Please select an item or enter a custom item name.');
            return false;
        }

        if (!data.quantity || data.quantity <= 0) {
            alert('Please enter a valid quantity greater than 0.');
            return false;
        }

        if (!data.unit) {
            alert('Please select a unit.');
            return false;
        }

        if (!data.date) {
            alert('Please select a date.');
            return false;
        }

        if (data.price < 0) {
            alert('Price cannot be negative.');
            return false;
        }

        return true;
    }

    addItem(data) {
        this.groceryList.push(data);
        console.log('Item added:', data);
    }

    updateItem(data) {
        if (this.editingIndex >= 0 && this.editingIndex < this.groceryList.length) {
            this.groceryList[this.editingIndex] = data;
            this.editingIndex = -1;
            this.toggleEditMode(false);
            
            // Highlight the updated row briefly
            setTimeout(() => {
                const row = document.querySelector(`tr[data-id="${data.id}"]`);
                if (row) {
                    row.classList.add('highlight');
                    setTimeout(() => row.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    }

    editItem(index) {
        if (index < 0 || index >= this.groceryList.length) return;

        const item = this.groceryList[index];
        this.editingIndex = index;

        // Populate form with item data
        const categoryElement = document.getElementById('category');
        const itemElement = document.getElementById('item');
        const customItemElement = document.getElementById('custom-item');
        const quantityElement = document.getElementById('quantity');
        const unitElement = document.getElementById('unit');
        const priceElement = document.getElementById('price');
        const commentElement = document.getElementById('comment');
        const dateElement = document.getElementById('date');

        if (categoryElement) categoryElement.value = item.category;
        this.populateItemDropdown(item.category);
        
        // Check if the item is in the predefined list or custom
        if (this.categories[item.category] && this.categories[item.category].includes(item.item)) {
            if (itemElement) itemElement.value = item.item;
            if (customItemElement) customItemElement.value = '';
        } else {
            if (itemElement) itemElement.value = '';
            if (customItemElement) customItemElement.value = item.item;
        }

        if (quantityElement) quantityElement.value = item.quantity;
        if (unitElement) unitElement.value = item.unit;
        if (priceElement) priceElement.value = item.price;
        if (commentElement) commentElement.value = item.comment;
        if (dateElement) dateElement.value = item.date;

        this.toggleEditMode(true);
        
        // Scroll to form
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    toggleEditMode(isEditing) {
        const formTitle = document.getElementById('form-title');
        const submitBtn = document.getElementById('submit-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        if (isEditing) {
            if (formTitle) formTitle.textContent = 'Update Item';
            if (submitBtn) {
                submitBtn.textContent = 'Update Item';
                submitBtn.className = 'btn btn--success';
            }
            if (cancelBtn) cancelBtn.classList.remove('hidden');
        } else {
            if (formTitle) formTitle.textContent = 'Add Item';
            if (submitBtn) {
                submitBtn.textContent = 'Add Item';
                submitBtn.className = 'btn btn--primary';
            }
            if (cancelBtn) cancelBtn.classList.add('hidden');
            this.editingIndex = -1;
        }
    }

    cancelEdit() {
        this.resetForm();
        this.toggleEditMode(false);
    }

    deleteItem(index) {
        if (index < 0 || index >= this.groceryList.length) return;

        const item = this.groceryList[index];
        this.showModal(
            'Delete Item',
            `Are you sure you want to delete "${item.item}"?`,
            () => {
                this.groceryList.splice(index, 1);
                this.renderTable();
                this.updateStats();
                this.saveData();
            }
        );
    }

    toggleBought(index) {
        if (index >= 0 && index < this.groceryList.length) {
            this.groceryList[index].bought = !this.groceryList[index].bought;
            this.renderTable();
            this.updateStats();
            this.saveData();
        }
    }

    markAllPurchased() {
        if (this.groceryList.length === 0) {
            alert('No items in the list to mark as purchased.');
            return;
        }

        const pendingItems = this.groceryList.filter(item => !item.bought).length;
        if (pendingItems === 0) {
            alert('All items are already marked as purchased.');
            return;
        }

        this.showModal(
            'Mark All as Purchased',
            `Are you sure you want to mark all ${pendingItems} pending items as purchased?`,
            () => {
                this.groceryList.forEach(item => item.bought = true);
                this.renderTable();
                this.updateStats();
                this.saveData();
            }
        );
    }

    clearAll() {
        if (this.groceryList.length === 0) {
            alert('The list is already empty.');
            return;
        }

        this.showModal(
            'Clear All Items',
            'Are you sure you want to remove all items from the list? This action cannot be undone.',
            () => {
                this.groceryList = [];
                this.renderTable();
                this.updateStats();
                this.saveData();
            }
        );
    }

    showModal(title, message, confirmCallback) {
        const modal = document.getElementById('confirmation-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');

        if (modalTitle) modalTitle.textContent = title;
        if (modalMessage) modalMessage.textContent = message;
        if (modal) modal.classList.remove('hidden');
        
        this.pendingConfirmAction = confirmCallback;
    }

    hideModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) modal.classList.add('hidden');
        this.pendingConfirmAction = null;
    }

    confirmAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
        }
        this.hideModal();
    }

    renderTable() {
        const tbody = document.querySelector('#grocery-table tbody');
        const emptyState = document.getElementById('empty-state');

        if (!tbody) return;

        if (this.groceryList.length === 0) {
            if (emptyState) emptyState.style.display = 'table-row';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        
        // Clear existing rows except empty state
        Array.from(tbody.children).forEach(row => {
            if (row.id !== 'empty-state') {
                row.remove();
            }
        });

        this.groceryList.forEach((item, index) => {
            const row = this.createTableRow(item, index);
            tbody.appendChild(row);
        });

        this.filterTable();
    }

    createTableRow(item, index) {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.className = item.bought ? 'bought' : '';

        //const total = (item.quantity * item.price).toFixed(2);
        const formattedDate = new Date(item.date).toLocaleDateString('en-GB');

        row.innerHTML = `
            <td>
                <div class="checkbox-wrapper">
                    <input type="checkbox" ${item.bought ? 'checked' : ''} 
                           onchange="groceryManager.toggleBought(${index})">
                </div>
            </td>
            <td>${formattedDate}</td>
            <td>${item.category}</td>
            <td>${item.item}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td class="price">₹${item.pricePerUnit.toFixed(2)}</td>
            <td class="total-price">₹${item.totalPrice.toFixed(2)}</td>
            <td>${item.comment || '-'}</td>
            <td>
                <div class="action-buttons-table">
                    <button class="btn btn--secondary btn--sm" onclick="groceryManager.editItem(${index})">
                        Edit
                    </button>
                    <button class="btn btn--danger btn--sm" onclick="groceryManager.deleteItem(${index})">
                        Delete
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    filterTable() {
        const searchInput = document.getElementById('search');
        const categoryFilter = document.getElementById('filter-category');
        const statusFilter = document.getElementById('filter-status');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const categoryFilterValue = categoryFilter ? categoryFilter.value : '';
        const statusFilterValue = statusFilter ? statusFilter.value : '';

        const rows = document.querySelectorAll('#grocery-table tbody tr:not(#empty-state)');
        
        rows.forEach(row => {
            const item = this.groceryList.find(item => item.id == row.dataset.id);
            if (!item) return;

            const matchesSearch = !searchTerm || 
                item.item.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                (item.comment && item.comment.toLowerCase().includes(searchTerm));

            const matchesCategory = !categoryFilterValue || item.category === categoryFilterValue;
            
            const matchesStatus = !statusFilterValue || 
                (statusFilterValue === 'bought' && item.bought) ||
                (statusFilterValue === 'pending' && !item.bought);

            if (matchesSearch && matchesCategory && matchesStatus) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none';
            }
        });
    }

    updateStats() {
        const totalItems = this.groceryList.length;
        const boughtItems = this.groceryList.filter(item => item.bought).length;
        const pendingItems = totalItems - boughtItems;
        //const totalCost = this.groceryList.reduce((sum, item) => sum + (item.quantity * item.price), 0);
		const totalCost = this.groceryList.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalItemsElement = document.getElementById('total-items');
        const boughtItemsElement = document.getElementById('bought-items');
        const pendingItemsElement = document.getElementById('pending-items');
        const totalCostElement = document.getElementById('total-cost');

        if (totalItemsElement) totalItemsElement.textContent = totalItems;
        if (boughtItemsElement) boughtItemsElement.textContent = boughtItems;
        if (pendingItemsElement) pendingItemsElement.textContent = pendingItems;
        if (totalCostElement) totalCostElement.textContent = `₹${totalCost.toFixed(2)}`;
    }

    resetForm() {
        const form = document.getElementById('grocery-form');
        if (form) {
            form.reset();
        }

        const itemSelect = document.getElementById('item');
        if (itemSelect) {
            itemSelect.disabled = true;
            itemSelect.innerHTML = '<option value="">Select Item</option>';
        }

        this.setTodayDate();
    }

    exportCSV() {
        if (this.groceryList.length === 0) {
            alert('No items to export.');
            return;
        }

        const headers = ['Date', 'Category', 'Item', 'Quantity', 'Unit', 'Price', 'Total', 'Comment', 'Status'];
        const csvContent = [
            headers.join(','),
            ...this.groceryList.map(item => [
                new Date(item.date).toLocaleDateString('en-GB'),
                item.category,
                `"${item.item}"`,
                item.quantity,
                item.unit,
                item.price.toFixed(2),
                (item.quantity * item.price).toFixed(2),
                `"${item.comment || ''}"`,
                item.bought ? 'Bought' : 'Pending'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grocery-list-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    saveData() {
        // Storage functionality disabled for sandbox environment
        try {
            console.log('Data would be saved:', this.groceryList);
        } catch (error) {
            console.log('Storage not available in this environment');
        }
    }

    loadData() {
        // Storage functionality disabled for sandbox environment  
        try {
            this.groceryList = [];
            console.log('Data loaded (empty for sandbox)');
        } catch (error) {
            console.log('Storage not available in this environment');
            this.groceryList = [];
        }
    }
	updatePriceLabel() {
		const priceLabel = document.getElementById('price-label');
		const priceTypeRadio = document.querySelector('input[name="price-type"]:checked');
		
		if (priceLabel && priceTypeRadio) {
			if (priceTypeRadio.value === 'perUnit') {
				priceLabel.textContent = 'Price per Unit (₹) *';
			} else {
				priceLabel.textContent = 'Net Price (₹) *';
			}
		}
	}

}




// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.groceryManager = new GroceryListManager();
});

// Export for global access
window.GroceryListManager = GroceryListManager;