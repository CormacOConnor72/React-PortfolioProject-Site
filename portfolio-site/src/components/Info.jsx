import { useEffect, useRef } from 'react';
import '../styles/Info.css';

const Info = () => {
  const sectionRef = useRef(null);

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

  return (
    <section className="info-section">
      <div className="container">
        <div ref={sectionRef} className="info-content">
          <h1 className="info-title">Personal Information</h1>
          
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">👨‍💻</div>
              <h2>Basic Information</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Name:</strong> Cormac O'Connor
                </div>
                <div className="info-item">
                  <strong>Age:</strong> 22 (template)
                </div>
                <div className="info-item">
                  <strong>Location:</strong> Dublin, Ireland (template)
                </div>
                <div className="info-item">
                  <strong>Occupation:</strong> Full Stack Developer (template)
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🎓</div>
              <h2>Education</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Degree:</strong> Computer Science (template)
                </div>
                <div className="info-item">
                  <strong>University:</strong> Trinity College Dublin (template)
                </div>
                <div className="info-item">
                  <strong>Graduation:</strong> 2024 (template)
                </div>
                <div className="info-item">
                  <strong>GPA:</strong> 3.8/4.0 (template)
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">💼</div>
              <h2>Professional</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Experience:</strong> 3+ years (template)
                </div>
                <div className="info-item">
                  <strong>Specialization:</strong> React, Node.js, AWS (template)
                </div>
                <div className="info-item">
                  <strong>Current Role:</strong> Senior Developer (template)
                </div>
                <div className="info-item">
                  <strong>Company:</strong> Tech Solutions Inc. (template)
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🌟</div>
              <h2>Interests</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Hobbies:</strong> Coding, Gaming, Photography (template)
                </div>
                <div className="info-item">
                  <strong>Sports:</strong> Football, Tennis (template)
                </div>
                <div className="info-item">
                  <strong>Music:</strong> Electronic, Rock (template)
                </div>
                <div className="info-item">
                  <strong>Travel:</strong> Europe, Asia (template)
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📞</div>
              <h2>Contact Details</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Email:</strong> cormac@example.com (template)
                </div>
                <div className="info-item">
                  <strong>Phone:</strong> +353 1 234 5678 (template)
                </div>
                <div className="info-item">
                  <strong>LinkedIn:</strong> linkedin.com/in/cormac-oconnor (template)
                </div>
                <div className="info-item">
                  <strong>GitHub:</strong> github.com/cormac-dev (template)
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🏆</div>
              <h2>Achievements</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Certifications:</strong> AWS Solutions Architect (template)
                </div>
                <div className="info-item">
                  <strong>Awards:</strong> Best Developer 2023 (template)
                </div>
                <div className="info-item">
                  <strong>Projects:</strong> 50+ completed projects (template)
                </div>
                <div className="info-item">
                  <strong>Languages:</strong> English (Native), Irish (Fluent) (template)
                </div>
              </div>
            </div>
          </div>

          <div className="info-note">
            <p><em>Note: This information page is for demonstration purposes. All details marked with "(template)" should be updated with actual information.</em></p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Info;