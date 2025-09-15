import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import '../styles/GlobalMetrics.css';

const GlobalMetrics = ({ variant = 'compact' }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const globalMetrics = await dataService.getGlobalMetrics();
      setMetrics(globalMetrics);
    } catch (error) {
      console.error('Failed to load global metrics:', error);
      setError('Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (error || !metrics) {
    return null; // Fail silently to not break the page
  }

  if (variant === 'compact') {
    return (
      <div className="global-metrics-compact">
        <div className="metrics-header">
          <h3>🌍 Global Activity</h3>
          {isLoading && <span className="loading-indicator">⏳</span>}
        </div>
        <div className="metrics-grid-compact">
          <div className="metric-item">
            <span className="metric-value">{isLoading ? '...' : metrics.totalSpins || 0}</span>
            <span className="metric-label">Total Spins</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{isLoading ? '...' : metrics.uniqueUsers || 0}</span>
            <span className="metric-label">Active Users</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{isLoading ? '...' : metrics.todaySpins || 0}</span>
            <span className="metric-label">Today</span>
          </div>
        </div>
        {metrics?.topEntries?.length > 0 && (
          <div className="top-entry-compact">
            <span className="popular-label">🏆 Most Popular:</span>
            <span className="popular-entry">{metrics.topEntries[0].name} ({metrics.topEntries[0].count})</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="global-metrics-full">
      <div className="metrics-header">
        <h3>🌍 Global Decision Metrics</h3>
        <button onClick={loadMetrics} className="refresh-btn" disabled={isLoading}>
          🔄 Refresh
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{isLoading ? '...' : metrics.totalSpins || 0}</div>
          <div className="metric-label">Total Spins</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{isLoading ? '...' : metrics.uniqueUsers || 0}</div>
          <div className="metric-label">Active Users</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{isLoading ? '...' : metrics.todaySpins || 0}</div>
          <div className="metric-label">Spins Today</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{isLoading ? '...' : metrics.weekSpins || 0}</div>
          <div className="metric-label">This Week</div>
        </div>
      </div>

      {metrics?.topEntries?.length > 0 && (
        <div className="top-entries">
          <h4>🏆 Most Popular Decisions</h4>
          <div className="top-entries-list">
            {metrics.topEntries.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="top-entry-item">
                <span className="entry-rank">#{idx + 1}</span>
                <span className="entry-name">{entry.name}</span>
                <span className="entry-count">{entry.count} spins</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalMetrics;