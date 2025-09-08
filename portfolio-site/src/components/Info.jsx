import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/shared.css';
import '../styles/Info.css';

const Info = () => {
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
          <h1 className="page-title animate-on-scroll">Personal Information</h1>
          <p className="page-subtitle animate-on-scroll">
            Get to know more about me, my background, and interests
          </p>
        </div>
      </header>

      <main className="info-main">
        <section className="page-section">
          <div className="page-container">
            <div className="info-content animate-on-scroll">
          
              <div className="info-grid">
                <div className="content-card info-card animate-on-scroll">
                  <div className="info-icon">👨‍💻</div>
                  <h2>Basic Information</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Name:</strong> Cormac O&apos;Connor
                </div>
                <div className="info-item">
                  <strong>Age:</strong> 23 
                </div>
                <div className="info-item">
                  <strong>Location:</strong> Amstelveen, North Holland
                </div>
                <div className="info-item">
                  <strong>Occupation:</strong> IT Systems Engineer
                </div>
              </div>
            </div>

                <div className="content-card info-card animate-on-scroll">
                  <div className="info-icon">🎓</div>
                  <h2>Education</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Degree:</strong> Computer Science 
                </div>
                <div className="info-item">
                  <strong>University:</strong> University Of Limerick
                </div>
                <div className="info-item">
                  <strong>Graduation:</strong> 2024 
                </div>
                <div className="info-item">
                  <strong>GPA:</strong> 3.2/4.0 
                </div>
              </div>
            </div>

                <div className="content-card info-card animate-on-scroll">
                  <div className="info-icon">💼</div>
                  <h2>Professional</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Experience:</strong> 3+ years in the technology sector
                </div>
                <div className="info-item">
                  <strong>Specialization:</strong> React, Node.js, AWS 
                </div>
                <div className="info-item">
                  <strong>Current Role:</strong> IT Systems Engineer
                </div>
                <div className="info-item">
                  <strong>Company:</strong> John Paul Construction
                </div>
              </div>
            </div>

                <div className="content-card info-card animate-on-scroll">
                  <div className="info-icon">🌟</div>
                  <h2>Interests</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Hobbies:</strong> Coding, Gaming, 3D-Printing, DND
                </div>
                <div className="info-item">
                  <strong>Sports:</strong> Climbing, Running, Karate, BJJ
                </div>
                <div className="info-item">
                  <strong>Music:</strong> Electronic, Indie Rock
                </div>
                <div className="info-item">
                  <strong>Travel:</strong> Europe
                </div>
              </div>
            </div>

                <div className="content-card info-card animate-on-scroll">
                  <div className="info-icon">📞</div>
                  <h2>Contact Details</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Email:</strong> cormacoconnor72@outlook.ie
                </div>
                <div className="info-item">
                  <strong>LinkedIn:</strong> https://www.linkedin.com/in/cormac-o-connor-705646261/
                </div>
                <div className="info-item">
                  <strong>GitHub:</strong> https://github.com/CormacOConnor72
                </div>
              </div>
            </div>

                <div className="content-card info-card animate-on-scroll">
                  <div className="info-icon">🏆</div>
                  <h2>Achievements</h2>
              <div className="info-details">
                <div className="info-item">
                  <strong>Certifications:</strong> AWS Solutions Architect (template)
                </div>
                <div className="info-item">
                  <strong>Projects:</strong> 50+ completed projects
                </div>
                <div className="info-item">
                  <strong>Languages:</strong> English (Native)
                </div>
              </div>
            </div>
          </div>

              <div className="info-note animate-on-scroll">
                <p><em>Note: This information page is for demonstration purposes.</em></p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Info;