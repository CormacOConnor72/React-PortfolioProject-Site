import { useState, useEffect, useRef, useMemo } from 'react';
import dataService from '../services/dataService';
import GlobalMetrics from './GlobalMetrics';
import '../styles/DataManager.css';

const DataManager = () => {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    who: '',
    why: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const sectionRef = useRef(null);

  // Load data from AWS API on component mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedEntries = await dataService.getAllEntries();
      setEntries(fetchedEntries);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('dataManagerUpdate', { detail: fetchedEntries }));
    } catch (error) {
      console.error('Failed to load entries:', error);
      setError('Failed to load entries. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    if (sectionRef.current) observer.observe(sectionRef.current);

    const gridRows = document.querySelectorAll('.data-grid-row');
    gridRows.forEach(row => observer.observe(row));

    return () => observer.disconnect();
  }, [entries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.type.trim() || !formData.who.trim() || !formData.why.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create entry data
      const entryData = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        who: formData.who.trim(),
        why: formData.why.trim()
      };

      // Save to AWS
      const newEntry = await dataService.createEntry(entryData);

      // Add to local state
      setEntries(prev => [newEntry, ...prev]);

      // Reset form
      setFormData({
        name: '',
        type: '',
        who: '',
        why: ''
      });

      // Notify other components
      window.dispatchEvent(new CustomEvent('dataManagerUpdate', { detail: [newEntry, ...entries] }));
      
      showSuccessMessage('Entry added successfully!');
    } catch (error) {
      console.error('Failed to create entry:', error);
      setError('Failed to add entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      setError(null);
      
      // Optimistically update UI
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      
      // Make API call
      await dataService.deleteEntry(id);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('dataManagerUpdate', { detail: updatedEntries }));
      
      // Show success message
      showSuccessMessage('Entry deleted successfully!');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      // Revert optimistic update on error
      loadEntries();
      setError('Failed to delete entry. Please try again.');
    }
  };

  const showSuccessMessage = (message) => {
    const successEl = document.createElement('div');
    successEl.className = 'success-toast';
    successEl.textContent = message;
    successEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(successEl);
    setTimeout(() => {
      successEl.remove();
    }, 3000);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all entries? This cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      await dataService.clearAllEntries();
      
      setEntries([]);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('dataManagerUpdate', { detail: [] }));
      
      showSuccessMessage('All entries cleared successfully!');
    } catch (error) {
      console.error('Failed to clear entries:', error);
      setError('Failed to clear entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Computed values for metrics and filtering
  const metrics = useMemo(() => {
    const total = entries.length;
    const types = entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {});
    
    const today = new Date();
    const thisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    }).length;
    
    const thisMonth = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.getMonth() === today.getMonth() && 
             entryDate.getFullYear() === today.getFullYear();
    }).length;

    return { total, types, thisWeek, thisMonth };
  }, [entries]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(entries.map(entry => entry.type))].sort();
  }, [entries]);

  // Filtered and sorted entries
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.name.toLowerCase().includes(term) ||
        entry.type.toLowerCase().includes(term) ||
        entry.who.toLowerCase().includes(term) ||
        entry.why.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'type':
          aVal = a.type.toLowerCase();
          bVal = b.type.toLowerCase();
          break;
        case 'who':
          aVal = a.who.toLowerCase();
          bVal = b.who.toLowerCase();
          break;
        case 'date':
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [entries, filterType, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <section className="data-manager">
      <div className="container">
        <div ref={sectionRef} className="data-manager-header">
          <h2 className="section-title">Data Manager</h2>
          <p className="section-subtitle">
            Comprehensive data management with real-time metrics and advanced filtering
          </p>
        </div>

        {/* Metrics Dashboard */}
        <div className="metrics-dashboard">
          <div className="metric-card">
            <div className="metric-value">{metrics.total}</div>
            <div className="metric-label">Total Entries</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.thisWeek}</div>
            <div className="metric-label">This Week</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.thisMonth}</div>
            <div className="metric-label">This Month</div>
          </div>
          <div className="metric-card types-breakdown">
            <div className="metric-label">Types</div>
            <div className="types-list">
              {Object.entries(metrics.types).slice(0, 3).map(([type, count]) => (
                <div key={type} className="type-stat">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.types).length > 3 && (
                <div className="type-stat more">
                  <span className="type-name">+{Object.keys(metrics.types).length - 3} more</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Metrics */}
        <GlobalMetrics variant="compact" />

        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="error-dismiss">✕</button>
            </div>
          </div>
        )}

        <div className="data-manager-content">
          {/* Form Section */}
          <div className="form-section">
            <h3>Add New Entry</h3>
            <form onSubmit={handleSubmit} className="data-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter entry name or title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Type</label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="Enter type (e.g., Issue, Task, Event)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="who">Who?</label>
                <input
                  type="text"
                  id="who"
                  name="who"
                  value={formData.who}
                  onChange={handleInputChange}
                  placeholder="Enter who is involved"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="why">Why?</label>
                <textarea
                  id="why"
                  name="why"
                  value={formData.why}
                  onChange={handleInputChange}
                  placeholder="Enter the reason or explanation"
                  rows="4"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Entry'}
              </button>
            </form>
          </div>

          {/* Data Display Section */}
          <div className="data-display">
            <div className="data-header">
              <h3>Entries ({filteredAndSortedEntries.length} of {entries.length})</h3>
              <div className="data-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {entries.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="clear-all-btn"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="data-grid-container loading">
                <div className="data-grid-header">
                  <div className="grid-cell header-name">Name</div>
                  <div className="grid-cell header-type">Type</div>
                  <div className="grid-cell header-who">Who?</div>
                  <div className="grid-cell header-why">Why?</div>
                  <div className="grid-cell header-date">Date Added</div>
                  <div className="grid-cell header-actions">Actions</div>
                </div>
                <div className="data-grid-body">
                  {[1, 2, 3].map((i) => (
                    <div key={`skeleton-${i}`} className="data-grid-row skeleton-row">
                      <div className="grid-cell name-cell"><div className="skeleton-text"></div></div>
                      <div className="grid-cell type-cell"><div className="skeleton-badge"></div></div>
                      <div className="grid-cell who-cell"><div className="skeleton-text"></div></div>
                      <div className="grid-cell why-cell"><div className="skeleton-text skeleton-long"></div></div>
                      <div className="grid-cell date-cell"><div className="skeleton-text skeleton-short"></div></div>
                      <div className="grid-cell actions-cell"><div className="skeleton-button"></div></div>
                    </div>
                  ))}
                </div>
                <div className="loading-overlay">
                  <div className="loading-spinner">🔄</div>
                  <h4>Loading entries...</h4>
                  <p>Fetching data from AWS</p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No entries yet</h4>
                <p>Add your first entry using the form above</p>
              </div>
            ) : (
              <div className="data-grid-container">
                <div className="data-grid-header">
                  <div className="grid-cell header-name sortable" onClick={() => handleSort('name')}>
                    Name {getSortIcon('name')}
                  </div>
                  <div className="grid-cell header-type sortable" onClick={() => handleSort('type')}>
                    Type {getSortIcon('type')}
                  </div>
                  <div className="grid-cell header-who sortable" onClick={() => handleSort('who')}>
                    Who? {getSortIcon('who')}
                  </div>
                  <div className="grid-cell header-why">Why?</div>
                  <div className="grid-cell header-date sortable" onClick={() => handleSort('date')}>
                    Date Added {getSortIcon('date')}
                  </div>
                  <div className="grid-cell header-actions">Actions</div>
                </div>
                <div className="data-grid-body">
                  {filteredAndSortedEntries.map((entry, index) => (
                    <div key={entry.id} className="data-grid-row" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="grid-cell name-cell" title={entry.name}>{entry.name}</div>
                      <div className="grid-cell type-cell">
                        <span className="type-badge" title={entry.type}>{entry.type}</span>
                      </div>
                      <div className="grid-cell who-cell" title={entry.who}>{entry.who}</div>
                      <div className="grid-cell why-cell" title={entry.why}>{entry.why}</div>
                      <div className="grid-cell date-cell" title={new Date(entry.createdAt).toLocaleString()}>
                        {formatDate(entry.createdAt)}
                      </div>
                      <div className="grid-cell actions-cell">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="delete-btn"
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAndSortedEntries.length === 0 && entries.length > 0 && (
                    <div className="no-results">
                      <div className="no-results-icon">🔍</div>
                      <h4>No matching entries</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataManager;