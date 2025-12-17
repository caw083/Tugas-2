import "../home_design/filter.css"
// FilterComponent.js
export default class FilterComponent {
    constructor(containerId = '#filter-container') {
      this.containerId = containerId;
      this.filters = {
        search: '',
        location: 'all',
        dateRange: 'all',
        sortBy: 'newest'
      };
      this.originalData = [];
      this.filteredData = [];
      this.onFilterChange = null;
      this.debounceTimer = null;
    }
  
    // Initialize filter component
    initialize(data = [], options = {}) {
      this.originalData = [...data];
      this.filteredData = [...data];
      
      const defaultOptions = {
        showSearch: true,
        showLocation: true,
        showDateRange: true,
        showSort: true,
        debounceTime: 300
      };
  
      this.options = { ...defaultOptions, ...options };
      this.render();
      this.setupEventListeners();
      
      return this;
    }
  
    // Set callback for filter changes
    onFilterChangeCallback(callback) {
      this.onFilterChange = callback;
      return this;
    }
  
    // Render filter UI
    render() {
      const container = document.querySelector(this.containerId);
      if (!container) {
        console.error(`Filter container ${this.containerId} not found`);
        return;
      }
  
      container.innerHTML = `
        <div class="filter-component">
          <div class="filter-header">
            <h3 class="filter-title">Filter Stories</h3>
            <button class="filter-reset-btn" type="button">Reset</button>
          </div>
          
          <div class="filter-content">
            ${this.options.showSearch ? this.renderSearchFilter() : ''}
            ${this.options.showLocation ? this.renderLocationFilter() : ''}
            ${this.options.showDateRange ? this.renderDateRangeFilter() : ''}
            ${this.options.showSort ? this.renderSortFilter() : ''}
          </div>
          
          <div class="filter-results">
            <span class="filter-results-count">
              Showing ${this.filteredData.length} of ${this.originalData.length} stories
            </span>
          </div>
        </div>
      `;
    }
  
    renderSearchFilter() {
      return `
        <div class="filter-group">
          <label class="filter-label" for="search-input">Search</label>
          <input 
            type="text" 
            id="search-input" 
            class="filter-input" 
            placeholder="Search by title or description..."
            value="${this.filters.search}"
          >
        </div>
      `;
    }
  
    renderLocationFilter() {
      const locations = this.getUniqueLocations();
      return `
        <div class="filter-group">
          <label class="filter-label" for="location-select">Location</label>
          <select id="location-select" class="filter-select">
            <option value="all">All Locations</option>
            ${locations.map(location => 
              `<option value="${location}" ${this.filters.location === location ? 'selected' : ''}>${location}</option>`
            ).join('')}
          </select>
        </div>
      `;
    }
  
    renderDateRangeFilter() {
      return `
        <div class="filter-group">
          <label class="filter-label" for="date-select">Date Range</label>
          <select id="date-select" class="filter-select">
            <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
            <option value="today" ${this.filters.dateRange === 'today' ? 'selected' : ''}>Today</option>
            <option value="week" ${this.filters.dateRange === 'week' ? 'selected' : ''}>This Week</option>
            <option value="month" ${this.filters.dateRange === 'month' ? 'selected' : ''}>This Month</option>
            <option value="year" ${this.filters.dateRange === 'year' ? 'selected' : ''}>This Year</option>
          </select>
        </div>
      `;
    }
  
    renderSortFilter() {
      return `
        <div class="filter-group">
          <label class="filter-label" for="sort-select">Sort By</label>
          <select id="sort-select" class="filter-select">
            <option value="newest" ${this.filters.sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${this.filters.sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="name-asc" ${this.filters.sortBy === 'name-asc' ? 'selected' : ''}>Name A-Z</option>
            <option value="name-desc" ${this.filters.sortBy === 'name-desc' ? 'selected' : ''}>Name Z-A</option>
          </select>
        </div>
      `;
    }
  
    // Setup event listeners
    setupEventListeners() {
      const container = document.querySelector(this.containerId);
      if (!container) return;
  
      // Search input
      const searchInput = container.querySelector('#search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.debounceFilter(() => {
            this.filters.search = e.target.value.trim();
            this.applyFilters();
          });
        });
      }
  
      // Location select
      const locationSelect = container.querySelector('#location-select');
      if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
          this.filters.location = e.target.value;
          this.applyFilters();
        });
      }
  
      // Date range select
      const dateSelect = container.querySelector('#date-select');
      if (dateSelect) {
        dateSelect.addEventListener('change', (e) => {
          this.filters.dateRange = e.target.value;
          this.applyFilters();
        });
      }
  
      // Sort select
      const sortSelect = container.querySelector('#sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.filters.sortBy = e.target.value;
          this.applyFilters();
        });
      }
  
      // Reset button
      const resetBtn = container.querySelector('.filter-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetFilters();
        });
      }
    }
  
    // Debounce function for search input
    debounceFilter(callback) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(callback, this.options.debounceTime);
    }
  
    // Get unique locations from data
    getUniqueLocations() {
      const locations = new Set();
      this.originalData.forEach(story => {
        if (story.location && story.location !== 'Unknown Location') {
          locations.add(story.location);
        }
      });
      return Array.from(locations).sort();
    }
  
    // Apply all filters
    applyFilters() {
      let filtered = [...this.originalData];
  
      // Apply search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        filtered = filtered.filter(story => 
          story.name.toLowerCase().includes(searchTerm) ||
          story.description.toLowerCase().includes(searchTerm)
        );
      }
  
      // Apply location filter
      if (this.filters.location !== 'all') {
        filtered = filtered.filter(story => 
          story.location === this.filters.location
        );
      }
  
      // Apply date range filter
      if (this.filters.dateRange !== 'all') {
        filtered = filtered.filter(story => 
          this.isWithinDateRange(story.createdAt, this.filters.dateRange)
        );
      }
  
      // Apply sorting
      filtered = this.sortData(filtered, this.filters.sortBy);
  
      this.filteredData = filtered;
      this.updateResultsCount();
      
      // Trigger callback
      if (this.onFilterChange) {
        this.onFilterChange(this.filteredData, this.filters);
      }
    }
  
    // Check if date is within specified range
    isWithinDateRange(dateString, range) {
      const storyDate = new Date(dateString);
      const now = new Date();
      
      switch (range) {
        case 'today':
          return storyDate.toDateString() === now.toDateString();
        
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return storyDate >= weekAgo;
        
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return storyDate >= monthAgo;
        
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return storyDate >= yearAgo;
        
        default:
          return true;
      }
    }
  
    // Sort data based on criteria
    sortData(data, sortBy) {
      const sorted = [...data];
      
      switch (sortBy) {
        case 'newest':
          return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        case 'oldest':
          return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        case 'name-asc':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        
        case 'name-desc':
          return sorted.sort((a, b) => b.name.localeCompare(a.name));
        
        default:
          return sorted;
      }
    }
  
    // Update results count display
    updateResultsCount() {
      const countElement = document.querySelector(`${this.containerId} .filter-results-count`);
      if (countElement) {
        countElement.textContent = `Showing ${this.filteredData.length} of ${this.originalData.length} stories`;
      }
    }
  
    // Reset all filters
    resetFilters() {
      this.filters = {
        search: '',
        location: 'all',
        dateRange: 'all',
        sortBy: 'newest'
      };
  
      // Reset UI elements
      const container = document.querySelector(this.containerId);
      if (container) {
        const searchInput = container.querySelector('#search-input');
        const locationSelect = container.querySelector('#location-select');
        const dateSelect = container.querySelector('#date-select');
        const sortSelect = container.querySelector('#sort-select');
  
        if (searchInput) searchInput.value = '';
        if (locationSelect) locationSelect.value = 'all';
        if (dateSelect) dateSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'newest';
      }
  
      this.applyFilters();
    }
  
    // Update data (when original data changes)
    updateData(newData) {
      this.originalData = [...newData];
      this.applyFilters();
      
      // Re-render location filter if it exists
      if (this.options.showLocation) {
        const locationSelect = document.querySelector(`${this.containerId} #location-select`);
        if (locationSelect) {
          const locations = this.getUniqueLocations();
          const currentValue = locationSelect.value;
          
          locationSelect.innerHTML = `
            <option value="all">All Locations</option>
            ${locations.map(location => 
              `<option value="${location}" ${currentValue === location ? 'selected' : ''}>${location}</option>`
            ).join('')}
          `;
        }
      }
    }
  
    // Get current filters
    getCurrentFilters() {
      return { ...this.filters };
    }
  
    // Get filtered data
    getFilteredData() {
      return [...this.filteredData];
    }
  
    // Set specific filter value
    setFilter(filterName, value) {
      if (this.filters.hasOwnProperty(filterName)) {
        this.filters[filterName] = value;
        
        // Update UI element
        const container = document.querySelector(this.containerId);
        if (container) {
          const element = container.querySelector(`#${filterName}-input, #${filterName}-select`);
          if (element) {
            element.value = value;
          }
        }
        
        this.applyFilters();
      }
    }
  
    // Show/hide filter component
    toggle(show = null) {
      const container = document.querySelector(this.containerId);
      if (container) {
        if (show === null) {
          container.style.display = container.style.display === 'none' ? 'block' : 'none';
        } else {
          container.style.display = show ? 'block' : 'none';
        }
      }
    }
  
    // Cleanup method
    destroy() {
      // Clear debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
  
      // Clear container
      const container = document.querySelector(this.containerId);
      if (container) {
        container.innerHTML = '';
      }
  
      // Reset data
      this.originalData = [];
      this.filteredData = [];
      this.onFilterChange = null;
    }
  
    // Static method for easy instantiation
    static create(containerId, data = [], options = {}) {
      const filterComponent = new FilterComponent(containerId);
      filterComponent.initialize(data, options);
      return filterComponent;
    }
  }