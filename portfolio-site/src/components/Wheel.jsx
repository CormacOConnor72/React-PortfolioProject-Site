import { useState, useEffect, useRef } from 'react';
import dataService from '../services/dataService';
import '../styles/Wheel.css';

const Wheel = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Get unique types for filter buttons
  const getUniqueTypes = () => {
    const types = entries.map(entry => entry.type.toLowerCase());
    return [...new Set(types)];
  };

  // Filter entries based on active filter
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredEntries(entries);
    } else {
      setFilteredEntries(entries.filter(entry => 
        entry.type.toLowerCase() === activeFilter.toLowerCase()
      ));
    }
  }, [activeFilter, entries]);

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

  // Spin the wheel
  const spinWheel = () => {
    if (filteredEntries.length === 0) {
      alert('No entries available! Please add some entries in the Data Manager first.');
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
      const selectedIndex = Math.floor((360 - normalizedDegree) / segmentSize) % filteredEntries.length;
      const winner = filteredEntries[selectedIndex];
      
      setSelectedEntry(winner);
      setIsSpinning(false);
    }, 3000); // Match CSS animation duration
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
      const startAngle = index * segmentAngle;
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
            Spin the wheel to randomly select from your data entries
          </p>
        </div>

        <div className="wheel-content">
          {/* Filter Controls */}
          <div className="wheel-filters">
            <button
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({entries.length})
            </button>
            {getUniqueTypes().map(type => {
              const count = entries.filter(entry => entry.type.toLowerCase() === type.toLowerCase()).length;
              return (
                <button
                  key={type}
                  className={`filter-btn ${activeFilter === type ? 'active' : ''}`}
                  onClick={() => setActiveFilter(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </button>
              );
            })}
            <button
              className="filter-btn refresh-btn"
              onClick={loadEntries}
              disabled={isLoading}
            >
              🔄 {isLoading ? 'Loading...' : 'Refresh'}
            </button>
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
                    style={{ transform: `rotate(${rotation}deg)` }}
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

          {/* Entries Count */}
          <div className="entries-info">
            <p>
              Showing {filteredEntries.length} of {entries.length} entries
              {activeFilter !== 'all' && ` (${activeFilter})`}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Status: {isLoading ? 'Loading from AWS...' : error ? 'Error loading data' : 'Connected to shared AWS database'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Wheel;