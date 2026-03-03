// Application logic for BoneHub Public Datasets
let allData = [];
let filteredData = [];
let columnFilters = {};
let visibleColumns = new Set();
let allColumns = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    if (typeof datasetsData === 'undefined') {
        showError('Dataset not loaded. Please run the update script.');
        return;
    }
    
    allData = datasetsData;
    filteredData = [...allData];
    
    // Initialize columns
    if (allData.length > 0) {
        allColumns = Object.keys(allData[0]);
        // Show all columns by default
        visibleColumns = new Set(allColumns);
    }
    
    initializeTable();
    initializeColumnToggles();
    updateDisplay();
    setupEventListeners();
});

// Initialize table headers and filter row
function initializeTable() {
    if (allData.length === 0) return;
    
    const headers = Object.keys(allData[0]);
    const headerRow = document.getElementById('tableHeader');
    const filterRow = document.getElementById('filterRow');
    
    // Clear existing content
    headerRow.innerHTML = '';
    filterRow.innerHTML = '';
    
    // Create header cells and filter inputs
    headers.forEach((header, index) => {
        // Header cell
        const th = document.createElement('th');
        th.textContent = header;
        th.dataset.column = header;
        th.dataset.columnIndex = index;
        headerRow.appendChild(th);
        
        // Filter cell
        const td = document.createElement('td');
        td.dataset.column = header;
        td.dataset.columnIndex = index;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-input';
        
        // Add helpful placeholder for numeric columns
        if (isNumericColumn(header)) {
            input.placeholder = `e.g., >100 or <50`;
            input.title = 'Supports: >, <, >=, <=, = followed by a number';
        } else {
            input.placeholder = `Filter ${header}...`;
        }
        
        input.dataset.column = header;
        
        input.addEventListener('input', function(e) {
            handleColumnFilter(header, e.target.value);
        });
        
        td.appendChild(input);
        filterRow.appendChild(td);
    });
    
    applyColumnVisibility();
}

// Initialize column visibility toggles
function initializeColumnToggles() {
    const container = document.getElementById('columnCheckboxes');
    container.innerHTML = '';
    
    allColumns.forEach(column => {
        const div = document.createElement('div');
        div.className = 'column-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${column.replace(/\s+/g, '-')}`;
        checkbox.checked = visibleColumns.has(column);
        checkbox.dataset.column = column;
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = column;
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                visibleColumns.add(column);
            } else {
                visibleColumns.delete(column);
            }
            applyColumnVisibility();
        });
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

// Apply column visibility to table
function applyColumnVisibility() {
    const headerRow = document.getElementById('tableHeader');
    const filterRow = document.getElementById('filterRow');
    const tbody = document.getElementById('tableBody');
    
    // Update header visibility
    if (headerRow) {
        Array.from(headerRow.children).forEach((th, index) => {
            const column = allColumns[index];
            if (visibleColumns.has(column)) {
                th.classList.remove('column-hidden');
            } else {
                th.classList.add('column-hidden');
            }
        });
    }
    
    // Update filter row visibility
    if (filterRow) {
        Array.from(filterRow.children).forEach((td, index) => {
            const column = allColumns[index];
            if (visibleColumns.has(column)) {
                td.classList.remove('column-hidden');
            } else {
                td.classList.add('column-hidden');
            }
        });
    }
    
    // Update body rows visibility
    if (tbody) {
        Array.from(tbody.children).forEach(tr => {
            Array.from(tr.children).forEach((td, index) => {
                const column = allColumns[index];
                if (visibleColumns.has(column)) {
                    td.classList.remove('column-hidden');
                } else {
                    td.classList.add('column-hidden');
                }
            });
        });
    }
}

// Handle column-specific filtering
function handleColumnFilter(column, value) {
    if (value.trim() === '') {
        delete columnFilters[column];
    } else {
        columnFilters[column] = value.trim();
    }
    applyFilters();
}

// Parse numeric comparison from filter value
function parseNumericComparison(filterValue) {
    const operators = [
        { regex: /^>=\s*(.+)/, op: '>=' },
        { regex: /^<=\s*(.+)/, op: '<=' },
        { regex: /^>\s*(.+)/, op: '>' },
        { regex: /^<\s*(.+)/, op: '<' },
        { regex: /^=\s*(.+)/, op: '=' }
    ];
    
    for (let { regex, op } of operators) {
        const match = filterValue.match(regex);
        if (match) {
            const value = parseFloat(match[1]);
            if (!isNaN(value)) {
                return { operator: op, value: value };
            }
        }
    }
    
    return null;
}

// Apply numeric filter
function applyNumericFilter(cellValue, comparison) {
    const numValue = parseFloat(cellValue);
    if (isNaN(numValue)) return false;
    
    switch (comparison.operator) {
        case '>': return numValue > comparison.value;
        case '<': return numValue < comparison.value;
        case '>=': return numValue >= comparison.value;
        case '<=': return numValue <= comparison.value;
        case '=': return numValue === comparison.value;
        default: return false;
    }
}

// Check if column is likely numeric
function isNumericColumn(columnName) {
    const numericColumns = ['Number of Subjects', 'Year', 'Size', 'Number of Samples'];
    return numericColumns.some(col => columnName.includes(col));
}

// Apply all filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredData = allData.filter(row => {
        // Apply column filters
        for (let [column, filterValue] of Object.entries(columnFilters)) {
            const cellValue = String(row[column] || '');
            
            // Check for numeric comparison operators
            if (isNumericColumn(column)) {
                const comparison = parseNumericComparison(filterValue);
                if (comparison) {
                    if (!applyNumericFilter(cellValue, comparison)) {
                        return false;
                    }
                    continue;
                }
            }
            
            // Default text-based filtering
            if (!cellValue.toLowerCase().includes(filterValue.toLowerCase())) {
                return false;
            }
        }
        
        // Apply global search
        if (searchTerm) {
            const rowText = Object.values(row).join(' ').toLowerCase();
            if (!rowText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    updateDisplay();
}

// Update table display
function updateDisplay() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = allColumns.length;
        emptyCell.className = 'empty-state';
        emptyCell.textContent = 'No datasets found matching your filters.';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    } else {
        filteredData.forEach(row => {
            const tr = document.createElement('tr');
            
            Object.entries(row).forEach(([key, value], index) => {
                const td = document.createElement('td');
                td.dataset.column = key;
                td.dataset.columnIndex = index;
                
                // Special handling for links
                if (key === 'Access Link' || key === 'Related Paper') {
                    td.innerHTML = createLinkButtons(value);
                } else {
                    td.textContent = value || '';
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    }
    
    applyColumnVisibility();
    updateStats();
}

// Create link buttons
function createLinkButtons(linkString) {
    if (!linkString || linkString.trim() === '') return '';
    
    const links = linkString.split(';').map(link => link.trim()).filter(link => link);
    
    if (links.length === 0) return '';
    
    return links.map((link, index) => {
        // Use "Link" for single link, or "Link 1", "Link 2", etc. for multiple
        const buttonText = links.length === 1 ? 'Link' : `Link ${index + 1}`;
        
        return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-link">${buttonText}</a>`;
    }).join(' ');
}

// Update statistics
function updateStats() {
    const statsElement = document.getElementById('datasetCount');
    statsElement.textContent = `Showing ${filteredData.length} of ${allData.length} datasets`;
}

// Setup event listeners
function setupEventListeners() {
    // Global search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        applyFilters();
    });
    
    // Clear filters button
    const clearButton = document.getElementById('clearFilters');
    clearButton.addEventListener('click', function() {
        // Clear global search
        document.getElementById('searchInput').value = '';
        
        // Clear column filters
        document.querySelectorAll('.filter-input').forEach(input => {
            input.value = '';
        });
        
        columnFilters = {};
        applyFilters();
    });
    
    // Toggle columns button
    const toggleColumnsButton = document.getElementById('toggleColumns');
    const columnToggles = document.getElementById('columnToggles');
    
    toggleColumnsButton.addEventListener('click', function() {
        if (columnToggles.style.display === 'none') {
            columnToggles.style.display = 'block';
        } else {
            columnToggles.style.display = 'none';
        }
    });
    
    // Export CSV button
    const exportButton = document.getElementById('exportCSV');
    exportButton.addEventListener('click', function() {
        exportToCSV();
    });
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.className = 'empty-state';
    td.textContent = message;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

// Export filtered data to CSV
function exportToCSV() {
    if (filteredData.length === 0) {
        alert('No data to export. Please adjust your filters.');
        return;
    }
    
    // Get visible columns only
    const columnsToExport = allColumns.filter(col => visibleColumns.has(col));
    
    // Create CSV content
    let csvContent = '';
    
    // Add header row
    csvContent += columnsToExport.map(col => `"${col}"`).join(',') + '\n';
    
    // Add data rows
    filteredData.forEach(row => {
        const rowData = columnsToExport.map(col => {
            let value = row[col] || '';
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            value = value.toString().replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            } else {
                value = `"${value}"`;
            }
            return value;
        });
        csvContent += rowData.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bonehub_datasets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
