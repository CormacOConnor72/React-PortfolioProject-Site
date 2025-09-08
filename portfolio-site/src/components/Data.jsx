import { useState } from 'react';
import DataManager from './DataManager';
import Wheel from './Wheel';
import { Link } from 'react-router-dom';
import '../styles/Data.css';

const Data = () => {
  const [activeTab, setActiveTab] = useState('manager');

  return (
    <div className="data-page">
      <header className="data-header">
        <div className="container">
          <Link to="/" className="back-link">← Back to Portfolio</Link>
          <h1>Data Management</h1>
          <p>Manage your data entries and use the interactive decision wheel</p>
        </div>
      </header>

      <div className="data-nav">
        <div className="container">
          <button 
            className={`tab-button ${activeTab === 'manager' ? 'active' : ''}`}
            onClick={() => setActiveTab('manager')}
          >
            Data Manager
          </button>
          <button 
            className={`tab-button ${activeTab === 'wheel' ? 'active' : ''}`}
            onClick={() => setActiveTab('wheel')}
          >
            Decision Wheel
          </button>
        </div>
      </div>

      <main className="data-content">
        <div className="container">
          {activeTab === 'manager' && (
            <section id="data-manager">
              <DataManager />
            </section>
          )}
          {activeTab === 'wheel' && (
            <section id="decision-wheel">
              <Wheel />
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Data;