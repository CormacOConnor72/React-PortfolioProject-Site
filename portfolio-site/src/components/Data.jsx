import { useState, useEffect } from 'react';
import DataManager from './DataManager';
import Wheel from './Wheel';
import { Link } from 'react-router-dom';
import '../styles/shared.css';
import '../styles/Data.css';

const Data = () => {
  const [activeTab, setActiveTab] = useState('manager');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    setIsVisible(true);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`page-transition ${isVisible ? 'page-loaded' : ''}`}>
      <header className="page-header">
        <div className="page-container">
          <Link to="/" className="page-back-link animate-on-scroll">← Back to Portfolio</Link>
          <h1 className="page-title animate-on-scroll">Data Management</h1>
          <p className="page-subtitle animate-on-scroll">
            Manage your data entries and use the interactive decision wheel
          </p>
        </div>
      </header>

      <nav className="data-nav">
        <div className="page-container">
          <div className="tab-list animate-on-scroll">
            <button 
              className={`tab-button ${activeTab === 'manager' ? 'active' : ''}`}
              onClick={() => setActiveTab('manager')}
            >
              <span className="tab-icon">📊</span>
              <span className="tab-label">Data Manager</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'wheel' ? 'active' : ''}`}
              onClick={() => setActiveTab('wheel')}
            >
              <span className="tab-icon">🎯</span>
              <span className="tab-label">Decision Wheel</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="data-content">
        <div className="page-container">
          <div className="tab-panel animate-on-scroll">
            {activeTab === 'manager' && (
              <section id="data-manager" className="page-section">
                <DataManager />
              </section>
            )}
            {activeTab === 'wheel' && (
              <section id="decision-wheel" className="page-section">
                <Wheel />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Data;