import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/shared.css';
import '../styles/TemplatePage.css';

const TemplatePage = () => {
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
      {/* Header Section */}
      <header className="page-header">
        <div className="page-container">
          <Link to="/" className="page-back-link animate-on-scroll">← Back to Portfolio</Link>
          <h1 className="page-title animate-on-scroll">Template Page</h1>
          <p className="page-subtitle animate-on-scroll">
            A foundation for building new sections with consistent styling
          </p>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="template-main">
        {/* Hero-style Section */}
        <section id="hero-section" className="page-section hero-style">
          <div className="page-container">
            <div className="section-content grid-layout">
              <div className="content-text animate-on-scroll">
                <h2 className="section-title">Hero Style Section</h2>
                <p className="section-description">
                  Large, impactful section similar to your main hero. Perfect for 
                  landing areas or major feature introductions.
                </p>
                <div className="section-actions">
                  <button className="btn btn-primary">Primary Action</button>
                  <button className="btn btn-secondary">Secondary Action</button>
                </div>
              </div>
              <div className="content-visual animate-on-scroll">
                <div className="visual-placeholder">
                  <span>📊</span>
                  <p>Visual Content</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section id="content-section" className="page-section content-style">
          <div className="page-container">
            <h2 className="section-title animate-on-scroll">Content Section</h2>
            <p className="section-subtitle animate-on-scroll">
              Standard section layout for regular content areas
            </p>
            <div className="content-grid-3 animate-on-scroll">
              <div className="content-card animate-on-scroll">
                <h3>Feature One</h3>
                <p>Description of your feature or content item.</p>
              </div>
              <div className="content-card animate-on-scroll">
                <h3>Feature Two</h3>
                <p>Another feature or content item description.</p>
              </div>
              <div className="content-card animate-on-scroll">
                <h3>Feature Three</h3>
                <p>Third feature or content item description.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section id="data-section" className="page-section data-style">
          <div className="page-container">
            <h2 className="section-title animate-on-scroll">Data Section</h2>
            <p className="section-subtitle animate-on-scroll">
              Structured layout for data-heavy content like tables, forms, or interactive elements
            </p>
            <div className="data-container animate-on-scroll">
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sample Item 1</td>
                      <td>Type A</td>
                      <td><span className="status active">Active</span></td>
                      <td><button className="btn-small">Edit</button></td>
                    </tr>
                    <tr>
                      <td>Sample Item 2</td>
                      <td>Type B</td>
                      <td><span className="status pending">Pending</span></td>
                      <td><button className="btn-small">Edit</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Section */}
        <section id="interactive-section" className="page-section interactive-style">
          <div className="page-container">
            <h2 className="section-title animate-on-scroll">Interactive Section</h2>
            <p className="section-subtitle animate-on-scroll">
              Space for interactive elements like forms, tools, or dynamic content
            </p>
            <div className="interactive-content animate-on-scroll">
              <div className="tool-container">
                <div className="tool-controls">
                  <button className="tool-btn active">Tool A</button>
                  <button className="tool-btn">Tool B</button>
                  <button className="tool-btn">Tool C</button>
                </div>
                <div className="tool-display">
                  <div className="tool-output">
                    <p>Interactive tool output area</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TemplatePage;