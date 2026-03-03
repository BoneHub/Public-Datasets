// Global variables
let datasetsData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };
let columnFilters = {};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if data is loaded
    if (typeof datasets !== 'undefined') {
        datasetsData = datasets;
        filteredData = [...datasetsData];
        renderTable();
        updateResultsCount();
        setupEventListeners();
    } else {
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" class="loading">Error: Dataset not loaded</td></tr>';
    }
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Column filters
    const columnFilterInputs = document.querySelectorAll('.column-filter');
    columnFilterInputs.forEach(input => {
        input.addEventListener('input', debounce(handleColumnFilter, 300));
    });

    // Sort headers
    const sortHeaders = document.querySelectorAll('thead th[data-column]');
    sortHeaders.forEach(header => {
        header.addEventListener('click', handleSort);
    });

    // Modal
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle global search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredData = datasetsData.filter(dataset => matchesColumnFilters(dataset));
    } else {
        filteredData = datasetsData.filter(dataset => {
            if (!matchesColumnFilters(dataset)) return false;
            
            // Search across all fields
            const searchableText = Object.values(dataset).join(' ').toLowerCase();
            return searchableText.includes(searchTerm);
        });
    }
    
    renderTable();
    updateResultsCount();
}

// Handle column-specific filters
function handleColumnFilter(event) {
    const column = event.target.dataset.column;
    const filterValue = event.target.value.toLowerCase().trim();
    
    if (filterValue) {
        columnFilters[column] = filterValue;
    } else {
        delete columnFilters[column];
    }
    
    // Reapply all filters
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm && Object.keys(columnFilters).length === 0) {
        filteredData = [...datasetsData];
    } else {
        filteredData = datasetsData.filter(dataset => {
            if (!matchesColumnFilters(dataset)) return false;
            
            if (searchTerm) {
                const searchableText = Object.values(dataset).join(' ').toLowerCase();
                return searchableText.includes(searchTerm);
            }
            
            return true;
        });
    }
    
    renderTable();
    updateResultsCount();
}

// Check if dataset matches all column filters
function matchesColumnFilters(dataset) {
    for (const [column, filterValue] of Object.entries(columnFilters)) {
        const cellValue = String(dataset[column] || '').toLowerCase();
        if (!cellValue.includes(filterValue)) {
            return false;
        }
    }
    return true;
}

// Handle sorting
function handleSort(event) {
    const column = event.currentTarget.dataset.column;
    
    // Toggle sort direction
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Sort data
    filteredData.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        // Handle numeric values
        if (column === 'year' || column === 'subjects') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update sort indicators
    document.querySelectorAll('thead th[data-column]').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    event.currentTarget.classList.add(`sorted-${currentSort.direction}`);
    
    renderTable();
}

// Render the table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <h3>No datasets found</h3>
                    <p>Try adjusting your search or filters</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map((dataset, index) => {
        const paperLinks = dataset.paper ? dataset.paper.split(';').map(link => link.trim()) : [];
        const accessLinks = dataset.link ? dataset.link.split(';').map(link => link.trim()) : [];
        
        return `
            <tr>
                <td><strong>${escapeHtml(dataset.name)}</strong></td>
                <td>${escapeHtml(dataset.year || 'N/A')}</td>
                <td>${escapeHtml(dataset.country || 'N/A')}</td>
                <td>${escapeHtml(dataset.modality || 'N/A')}</td>
                <td>${escapeHtml(dataset.subjects || 'N/A')}</td>
                <td>${escapeHtml(dataset.access || 'N/A')}</td>
                <td>${escapeHtml(dataset.license || 'N/A')}</td>
                <td class="actions-column">
                    <div class="btn-group">
                        ${accessLinks.length > 0 ? 
                            `<a href="${accessLinks[0]}" target="_blank" class="btn btn-primary">View Dataset</a>` :
                            `<button class="btn btn-primary" disabled>No Link</button>`
                        }
                        ${paperLinks.length > 0 ? 
                            `<a href="${paperLinks[0]}" target="_blank" class="btn btn-secondary">Read Paper</a>` :
                            `<button class="btn btn-secondary" disabled>No Paper</button>`
                        }
                        <button class="btn btn-info" onclick="showDetails(${index})">Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update results count
function updateResultsCount() {
    const count = filteredData.length;
    const total = datasetsData.length;
    const resultsCount = document.getElementById('resultsCount');
    
    if (count === total) {
        resultsCount.textContent = `Showing all ${total} datasets`;
    } else {
        resultsCount.textContent = `Showing ${count} of ${total} datasets`;
    }
}

// Show dataset details in modal
function showDetails(index) {
    const dataset = filteredData[index];
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    const paperLinks = dataset.paper ? dataset.paper.split(';').map(link => link.trim()) : [];
    const accessLinks = dataset.link ? dataset.link.split(';').map(link => link.trim()) : [];
    
    let html = `
        <h2>${escapeHtml(dataset.name)}</h2>
        
        <h3>Basic Information</h3>
        <p><strong>Country:</strong> ${escapeHtml(dataset.country || 'N/A')}</p>
        <p><strong>Year:</strong> ${escapeHtml(dataset.year || 'N/A')}</p>
        <p><strong>Size:</strong> ${escapeHtml(dataset.size || 'N/A')}</p>
        <p><strong>Number of Subjects:</strong> ${escapeHtml(dataset.subjects || 'N/A')}</p>
        
        <h3>Imaging Details</h3>
        <p><strong>Medical Images Included:</strong> ${escapeHtml(dataset.medicalImages || 'N/A')}</p>
        <p><strong>Imaging Modality:</strong> ${escapeHtml(dataset.modality || 'N/A')}</p>
        <p><strong>Image Source:</strong> ${escapeHtml(dataset.imageSource || 'N/A')}</p>
        <p><strong>Primary Imaged Regions:</strong> ${escapeHtml(dataset.primaryRegions || 'N/A')}</p>
        <p><strong>Secondary Imaged Regions:</strong> ${escapeHtml(dataset.secondaryRegions || 'N/A')}</p>
        
        <h3>Available Data</h3>
        <p><strong>Available 3D Bone Shapes:</strong> ${escapeHtml(dataset.boneShapes || 'N/A')}</p>
        <p><strong>Additional Structures:</strong> ${escapeHtml(dataset.additionalStructures || 'N/A')}</p>
        <p><strong>Landmarks:</strong> ${escapeHtml(dataset.landmarks || 'N/A')}</p>
        <p><strong>Voxel Segmentation Mask:</strong> ${escapeHtml(dataset.voxelMask || 'N/A')}</p>
        <p><strong>Mesh Model:</strong> ${escapeHtml(dataset.meshModel || 'N/A')}</p>
        <p><strong>CAD Model:</strong> ${escapeHtml(dataset.cadModel || 'N/A')}</p>
        
        <h3>Subject Information</h3>
        <p><strong>Available Information per Subject:</strong> ${escapeHtml(dataset.subjectInfo || 'N/A')}</p>
        <p><strong>Subjects Vital Status:</strong> ${escapeHtml(dataset.vitalStatus || 'N/A')}</p>
        <p><strong>Subjects Clinical Condition:</strong> ${escapeHtml(dataset.clinicalCondition || 'N/A')}</p>
        
        <h3>Access and Licensing</h3>
        <p><strong>Access Policy:</strong> ${escapeHtml(dataset.access || 'N/A')}</p>
        <p><strong>Data Redistribution Policy:</strong> ${escapeHtml(dataset.redistribution || 'N/A')}</p>
        <p><strong>Research Use Policy:</strong> ${escapeHtml(dataset.research || 'N/A')}</p>
        <p><strong>Commercial Use Policy:</strong> ${escapeHtml(dataset.commercial || 'N/A')}</p>
        <p><strong>License:</strong> ${escapeHtml(dataset.license || 'N/A')}</p>
        
        <h3>Links</h3>
    `;
    
    if (accessLinks.length > 0) {
        html += '<p><strong>Access Links:</strong></p><ul>';
        accessLinks.forEach(link => {
            html += `<li><a href="${link}" target="_blank">${link}</a></li>`;
        });
        html += '</ul>';
    }
    
    if (paperLinks.length > 0) {
        html += '<p><strong>Related Papers:</strong></p><ul>';
        paperLinks.forEach(link => {
            html += `<li><a href="${link}" target="_blank">${link}</a></li>`;
        });
        html += '</ul>';
    }
    
    if (dataset.remarks) {
        html += `<h3>Remarks</h3><p>${escapeHtml(dataset.remarks)}</p>`;
    }
    
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
