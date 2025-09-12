import { useState, useEffect, useRef, useMemo } from 'react';
import dataService from '../services/dataService';
import '../styles/Wheel.css';

const Wheel = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [spinHistory, setSpinHistory] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [weightedMode, setWeightedMode] = useState(false);
  const wheelRef = useRef(null);
  const sectionRef = useRef(null);

  // Load data from AWS API on component mount and set up listener
  useEffect(() => {
    loadEntries();

    // Listen for custom events (when DataManager updates)
    const handleDataManagerUpdate = (event) => {
      console.log('Wheel: DataManager update detected', event.detail);
      setEntries(event.detail);
      setFilteredEntries(event.detail);
    };

    window.addEventListener('dataManagerUpdate', handleDataManagerUpdate);

    return () => {
      window.removeEventListener('dataManagerUpdate', handleDataManagerUpdate);
    };
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Wheel: Loading entries from AWS API...');
      const fetchedEntries = await dataService.getAllEntries();
      console.log('Wheel: Fetched entries:', fetchedEntries);
      setEntries(fetchedEntries);
      setFilteredEntries(fetchedEntries);
    } catch (error) {
      console.error('Wheel: Failed to load entries:', error);
      setError('Failed to load entries from server');
    } finally {
      setIsLoading(false);
    }
  };

  // Computed values for metrics and filtering
  const metrics = useMemo(() => {
    const total = entries.length;
    const types = entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {});
    
    const today = new Date();
    const recentSpins = spinHistory.filter(spin => {
      const spinDate = new Date(spin.timestamp);
      const hourAgo = new Date(today.getTime() - 60 * 60 * 1000);
      return spinDate >= hourAgo;
    }).length;
    
    const mostSpun = spinHistory.reduce((acc, spin) => {
      const key = spin.entry.name;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    const topSpun = Object.entries(mostSpun)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return { total, types, recentSpins, topSpun, totalSpins: spinHistory.length };
  }, [entries, spinHistory]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(entries.map(entry => entry.type))].sort();
  }, [entries]);

  // Advanced filtering with search and type filter
  useEffect(() => {
    let filtered = entries;
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.type === activeFilter);
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
    
    setFilteredEntries(filtered);
  }, [activeFilter, searchTerm, entries]);

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

    return () => observer.disconnect();
  }, []);

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

  // Enhanced spin wheel with history tracking
  const spinWheel = () => {
    if (filteredEntries.length === 0) {
      showErrorMessage('No entries available! Please add some entries in the Data Manager first.');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedEntry(null);

    // Calculate random rotation (multiple full spins + random position)
    const randomSpins = 5 + Math.random() * 5; // 5-10 full rotations
    const randomDegree = Math.random() * 360;
    const totalRotation = rotation + (randomSpins * 360) + randomDegree;
    
    setRotation(totalRotation);

    // Calculate which entry was selected based on final position
    setTimeout(() => {
      const normalizedDegree = totalRotation % 360;
      const segmentSize = 360 / filteredEntries.length;
      // Adjust for pointer at top (12 o'clock) - add 90 degrees to align properly
      const adjustedDegree = (normalizedDegree + 90) % 360;
      const selectedIndex = Math.floor(adjustedDegree / segmentSize) % filteredEntries.length;
      const winner = filteredEntries[selectedIndex];
      
      // Add to spin history
      const spinRecord = {
        id: Date.now(),
        entry: winner,
        timestamp: new Date().toISOString(),
        filterUsed: activeFilter,
        totalOptions: filteredEntries.length
      };
      
      setSpinHistory(prev => [spinRecord, ...prev.slice(0, 49)]); // Keep last 50 spins
      setSelectedEntry(winner);
      setIsSpinning(false);
      
      showSuccessMessage(`🎯 Selected: ${winner.name}`);
    }, 3000); // Match CSS animation duration
  };

  const showErrorMessage = (message) => {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-toast';
    errorEl.textContent = message;
    errorEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(errorEl);
    setTimeout(() => {
      errorEl.remove();
    }, 3000);
  };

  const clearHistory = () => {
    if (window.confirm('Clear all spin history? This cannot be undone.')) {
      setSpinHistory([]);
      showSuccessMessage('Spin history cleared');
    }
  };

  const clearFilters = () => {
    setActiveFilter('all');
    setSearchTerm('');
    showSuccessMessage('Filters cleared');
  };

  // Generate wheel segments
  const generateWheelSegments = () => {
    if (filteredEntries.length === 0) return [];

    const segmentAngle = 360 / filteredEntries.length;
    const colors = [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
      '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#eab308'
    ];

    return filteredEntries.map((entry, index) => {
      // Adjust starting angle to align with pointer at top (subtract 90 degrees)
      const startAngle = (index * segmentAngle) - 90;
      const endAngle = startAngle + segmentAngle;
      const color = colors[index % colors.length];
      
      return {
        ...entry,
        startAngle,
        endAngle,
        color,
        index
      };
    });
  };

  const wheelSegments = generateWheelSegments();

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedEntry(null);
  }, [activeFilter]);

  return (
    <section className="wheel-section">
      <div className="container">
        <div ref={sectionRef} className="wheel-header">
          <h2 className="section-title">Decision Wheel</h2>
          <p className="section-subtitle">
            Advanced decision-making tool with comprehensive analytics and spin history
          </p>
        </div>

        {/* Metrics Dashboard */}
        <div className="wheel-metrics-dashboard">
          <div className="wheel-metric-card">
            <div className="metric-value">{metrics.total}</div>
            <div className="metric-label">Total Entries</div>
          </div>
          <div className="wheel-metric-card">
            <div className="metric-value">{metrics.totalSpins}</div>
            <div className="metric-label">Total Spins</div>
          </div>
          <div className="wheel-metric-card">
            <div className="metric-value">{filteredEntries.length}</div>
            <div className="metric-label">Current Pool</div>
          </div>
          <div className="wheel-metric-card most-spun">
            <div className="metric-label">Most Spun</div>
            <div className="most-spun-list">
              {metrics.topSpun.length > 0 ? metrics.topSpun.slice(0, 2).map((item, idx) => (
                <div key={idx} className="most-spun-item">
                  <span className="spun-name">{item.name.slice(0, 12)}{item.name.length > 12 ? '...' : ''}</span>
                  <span className="spun-count">{item.count}</span>
                </div>
              )) : (
                <div className="most-spun-item">
                  <span className="spun-name">No spins yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="wheel-content">
          {/* Advanced Controls */}
          <div className="wheel-controls-section">
            <div className="wheel-primary-controls">
              <div className="search-filter-group">
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
                  value={activeFilter} 
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types ({entries.length})</option>
                  {uniqueTypes.map(type => {
                    const count = entries.filter(entry => entry.type === type).length;
                    return (
                      <option key={type} value={type}>{type} ({count})</option>
                    );
                  })}
                </select>
                <button
                  className="control-btn clear-filters"
                  onClick={clearFilters}
                  disabled={activeFilter === 'all' && !searchTerm}
                >
                  Clear Filters
                </button>
              </div>
              
              <div className="action-buttons">
                <button
                  className="control-btn refresh-btn"
                  onClick={loadEntries}
                  disabled={isLoading}
                >
                  🔄 {isLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  className="control-btn advanced-toggle"
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                >
                  ⚙️ Advanced
                </button>
                {spinHistory.length > 0 && (
                  <button
                    className="control-btn clear-history"
                    onClick={clearHistory}
                  >
                    🗑️ Clear History
                  </button>
                )}
              </div>
            </div>
            
            {showAdvancedControls && (
              <div className="advanced-controls">
                <div className="advanced-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={weightedMode}
                      onChange={(e) => setWeightedMode(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Weighted mode (recent entries have higher chance)
                  </label>
                </div>
                
                {spinHistory.length > 0 && (
                  <div className="recent-spins">
                    <h4>Recent Spins ({spinHistory.slice(0, 5).length})</h4>
                    <div className="spin-history-list">
                      {spinHistory.slice(0, 5).map((spin) => (
                        <div key={spin.id} className="spin-history-item">
                          <span className="spin-entry">{spin.entry.name}</span>
                          <span className="spin-time">{new Date(spin.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Winner Banner */}
          {selectedEntry && (
            <div className="winner-banner">
              <div className="winner-content">
                <div className="winner-icon">🎉</div>
                <h3>Winner!</h3>
                <div className="winner-details">
                  <h4>{selectedEntry.name}</h4>
                  <span className="winner-type">{selectedEntry.type}</span>
                  <p><strong>Who:</strong> {selectedEntry.who}</p>
                  <p><strong>Why:</strong> {selectedEntry.why}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
                <button onClick={() => setError(null)} className="error-dismiss">✕</button>
              </div>
            </div>
          )}

          {/* Wheel Container */}
          <div className="wheel-container">
            {isLoading ? (
              <div className="loading-wheel">
                <div className="loading-spinner">🔄</div>
                <h3>Loading entries...</h3>
                <p>Fetching shared data from AWS</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="empty-wheel">
                <div className="empty-icon">🎯</div>
                <h3>No entries to spin!</h3>
                <p>Add some entries in the Data Manager to use the wheel</p>
              </div>
            ) : (
              <>
                <div className="wheel-wrapper">
                  <svg
                    ref={wheelRef}
                    className={`wheel ${isSpinning ? 'spinning' : ''}`}
                    width="400"
                    height="400"
                    viewBox="0 0 400 400"
                    style={{ transform: `rotate(${rotation}deg)`, cursor: isSpinning ? 'default' : 'pointer' }}
                    onClick={spinWheel}
                  >
                    {wheelSegments.map((segment) => {
                      const { startAngle, endAngle, color, name, index } = segment;
                      const centerX = 200;
                      const centerY = 200;
                      const radius = 180;
                      
                      // Convert angles to radians
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      
                      // Calculate path coordinates
                      const x1 = centerX + radius * Math.cos(startRad);
                      const y1 = centerY + radius * Math.sin(startRad);
                      const x2 = centerX + radius * Math.cos(endRad);
                      const y2 = centerY + radius * Math.sin(endRad);
                      
                      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');
                      
                      // Calculate text position
                      const textAngle = (startAngle + endAngle) / 2;
                      const textRad = (textAngle * Math.PI) / 180;
                      const textRadius = radius * 0.7;
                      const textX = centerX + textRadius * Math.cos(textRad);
                      const textY = centerY + textRadius * Math.sin(textRad);
                      
                      return (
                        <g key={index}>
                          <path
                            d={pathData}
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth="2"
                            opacity="0.9"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill="white"
                            fontSize="12"
                            fontWeight="600"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                            style={{ 
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                              maxWidth: '80px'
                            }}
                          >
                            {name.length > 12 ? name.substring(0, 12) + '...' : name}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Center circle */}
                    <circle
                      cx="200"
                      cy="200"
                      r="30"
                      fill="rgba(255, 255, 255, 0.9)"
                      stroke="var(--primary-color)"
                      strokeWidth="3"
                    />
                    <text
                      x="200"
                      y="200"
                      fill="var(--primary-color)"
                      fontSize="16"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      SPIN
                    </text>
                  </svg>
                  
                  {/* Pointer */}
                  <div className="wheel-pointer">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <path
                        d="M20 5 L30 20 L20 15 L10 20 Z"
                        fill="var(--primary-color)"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                {/* Spin Button */}
                <button
                  className={`spin-button ${isSpinning ? 'spinning' : ''}`}
                  onClick={spinWheel}
                  disabled={isSpinning}
                >
                  {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                </button>
              </>
            )}
          </div>

          {/* Enhanced Entries Info */}
          <div className="entries-info">
            <div className="info-stats">
              <div className="stat-item">
                <span className="stat-label">Showing:</span>
                <span className="stat-value">{filteredEntries.length} of {entries.length} entries</span>
              </div>
              {activeFilter !== 'all' && (
                <div className="stat-item">
                  <span className="stat-label">Filter:</span>
                  <span className="stat-value filter-badge">{activeFilter}</span>
                </div>
              )}
              {searchTerm && (
                <div className="stat-item">
                  <span className="stat-label">Search:</span>
                  <span className="stat-value search-badge">&quot;{searchTerm}&quot;</span>
                </div>
              )}
            </div>
            <div className="connection-status">
              <span className={`status-indicator ${isLoading ? 'loading' : error ? 'error' : 'connected'}`}></span>
              <span className="status-text">
                {isLoading ? 'Loading from AWS...' : error ? 'Error loading data' : 'Connected to AWS database'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Wheel;