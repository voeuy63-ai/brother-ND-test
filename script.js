const API_URL = window.location.origin + '/api';

// Load plugins on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPlugins();
    loadStats();
    loadSales();
});

// Load Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        document.getElementById('total-plugins').textContent = stats.total_plugins;
        document.getElementById('available-stock').textContent = stats.available_stock;
        document.getElementById('total-revenue').textContent = stats.total_revenue;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Plugins
async function loadPlugins() {
    try {
        const response = await fetch(`${API_URL}/plugins`);
        const plugins = await response.json();
        
        const pluginList = document.getElementById('plugin-list');
        const noPlugins = document.getElementById('no-plugins');
        
        pluginList.innerHTML = '';
        
        if (plugins.length === 0) {
            noPlugins.style.display = 'block';
            return;
        }
        
        noPlugins.style.display = 'none';
        
        plugins.forEach((plugin, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${plugin.name}</strong></td>
                <td><span class="badge badge-${plugin.category}">${plugin.category}</span></td>
                <td>$${parseFloat(plugin.price).toFixed(2)}</td>
                <td>${plugin.stock}</td>
                <td><span class="status ${plugin.status === 'active' ? 'active' : 'inactive'}">${plugin.status}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editPlugin(${plugin.id})" title="កែសម្រួល">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deletePlugin(${plugin.id})" title="លុប">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            pluginList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading plugins:', error);
    }
}

// Add Plugin
document.getElementById('add-plugin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('plugin-name').value);
    formData.append('price', document.getElementById('plugin-price').value);
    formData.append('stock', document.getElementById('plugin-stock').value);
    formData.append('category', document.getElementById('plugin-category').value);
    formData.append('description', document.getElementById('plugin-description').value);
    
    const fileInput = document.getElementById('plugin-file');
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }
    
    try {
        const response = await fetch(`${API_URL}/plugins`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ ' + result.message);
            document.getElementById('add-plugin-form').reset();
            loadPlugins();
            loadStats();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ មានបញ្ហាក្នុងការបន្ថែម Plugin');
        console.error(error);
    }
});

// Edit Plugin
async function editPlugin(id) {
    try {
        const response = await fetch(`${API_URL}/plugins`);
        const plugins = await response.json();
        const plugin = plugins.find(p => p.id === id);
        
        if (plugin) {
            document.getElementById('edit-id').value = plugin.id;
            document.getElementById('edit-name').value = plugin.name;
            document.getElementById('edit-price').value = plugin.price;
            document.getElementById('edit-stock').value = plugin.stock;
            
            document.getElementById('edit-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading plugin:', error);
    }
}

// Save Edit
document.getElementById('edit-plugin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const data = {
        name: document.getElementById('edit-name').value,
        price: parseFloat(document.getElementById('edit-price').value),
        stock: parseInt(document.getElementById('edit-stock').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/plugins/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ ' + result.message);
            closeModal();
            loadPlugins();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ មានបញ្ហាកនុងការកែសម្រួល');
        console.error(error);
    }
});

// Delete Plugin
async function deletePlugin(id) {
    if (!confirm('តើអ្នកប្រាកដជាចង់លុប Plugin នេះមែនទេ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/plugins/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ ' + result.message);
            loadPlugins();
            loadStats();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ មានបញ្ហាក្នុងការលុប');
        console.error(error);
    }
}

// Modal functions
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Search functionality
document.getElementById('search-plugin').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#plugin-list tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Load Sales
async function loadSales() {
    try {
        const response = await fetch(`${API_URL}/sales`);
        const sales = await response.json();
        
        const salesList = document.getElementById('sales-list');
        salesList.innerHTML = '';
        
        sales.slice(0, 10).forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(sale.purchased_at).toLocaleString()}</td>
                <td>${sale.plugin_name || 'N/A'}</td>
                <td>${sale.username || 'User ' + sale.user_id}</td>
                <td>$${parseFloat(sale.amount).toFixed(2)}</td>
                <td><span class="status ${sale.status === 'PAID' ? 'active' : 'pending'}">${sale.status}</span></td>
            `;
            salesList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading sales:', error);
    }
}

function logout() {
    if (confirm('តើអ្នកចង់ចាកចេញមែនទេ?')) {
        alert('Logout successful!');
    }
    }
