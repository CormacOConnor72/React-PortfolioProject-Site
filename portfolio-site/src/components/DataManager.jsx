import { useState, useEffect, useRef } from 'react';
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
  const sectionRef = useRef(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('dataManagerEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save data to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('dataManagerEntries', JSON.stringify(entries));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('dataManagerUpdate', { detail: entries }));
  }, [entries]);

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

    const tableRows = document.querySelectorAll('.data-row');
    tableRows.forEach(row => observer.observe(row));

    return () => observer.disconnect();
  }, [entries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.type.trim() || !formData.who.trim() || !formData.why.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    // Create new entry with timestamp and ID
    const newEntry = {
      id: Date.now() + Math.random(),
      name: formData.name.trim(),
      type: formData.type.trim(),
      who: formData.who.trim(),
      why: formData.why.trim(),
      createdAt: new Date().toISOString()
    };

    // Add to entries
    setEntries(prev => [newEntry, ...prev]);

    // Reset form
    setFormData({
      name: '',
      type: '',
      who: '',
      why: ''
    });

    setIsSubmitting(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all entries? This cannot be undone.')) {
      setEntries([]);
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

  return (
    <section className="data-manager">
      <div className="container">
        <div ref={sectionRef} className="data-manager-header">
          <h2 className="section-title">Data Manager</h2>
          <p className="section-subtitle">
            Add and manage your data entries with Name, Type, Who, and Why information
          </p>
        </div>

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
              <h3>All Entries ({entries.length})</h3>
              {entries.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="clear-all-btn"
                >
                  Clear All
                </button>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No entries yet</h4>
                <p>Add your first entry using the form above</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Who?</th>
                      <th>Why?</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="data-row">
                        <td className="name-cell">{entry.name}</td>
                        <td className="type-cell">
                          <span className="type-badge">{entry.type}</span>
                        </td>
                        <td className="who-cell">{entry.who}</td>
                        <td className="why-cell">{entry.why}</td>
                        <td className="date-cell">{formatDate(entry.createdAt)}</td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="delete-btn"
                            title="Delete entry"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataManager;