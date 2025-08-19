import { useEffect, useRef } from 'react';
import '../styles/Hero.css';

const Hero = () => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);

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

    const refs = [titleRef, subtitleRef, ctaRef];
    refs.forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToProjects = () => {
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const highlights = [
    { icon: '🎓', label: 'UL Graduate', value: 'Computer Science' },
    { icon: '⚛️', label: 'Frontend', value: 'React Expert' },
    { icon: '💎', label: 'Backend', value: 'Ruby on Rails' },
    { icon: '🚀', label: 'Ready for', value: 'New Opportunities' }
  ];

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
        </div>
      </div>
      
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="badge-icon">💼</span>
            <span className="badge-text">Open to Work</span>
          </div>
          
          <h1 ref={titleRef} className="hero-title">
            <span className="title-greeting">Hello, I'm</span>
            <span className="highlight">Cormac O'Connor</span>
            <span className="title-role">IT Systems Engineer</span>
          </h1>
          
          <p ref={subtitleRef} className="hero-subtitle">
            Transforming ideas into <span className="accent">scalable digital solutions</span> 
            with modern web technologies
          </p>
          
          <p className="hero-description">
            UL Computer Science graduate with expertise in React & Ruby on Rails. 
            I build efficient, user-focused applications that solve real business problems.
            <strong> Ready to contribute to your team's success.</strong>
          </p>

          <div className="hero-highlights">
            {highlights.map((item, index) => (
              <div key={index} className="highlight-card">
                <span className="highlight-icon">{item.icon}</span>
                <div className="highlight-content">
                  <span className="highlight-label">{item.label}</span>
                  <span className="highlight-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div ref={ctaRef} className="hero-cta">
            <button className="btn btn-primary" onClick={scrollToProjects}>
              <span>🔍 View My Projects</span>
            </button>
            <button className="btn btn-secondary" onClick={scrollToContact}>
              <span>📧 Let's Connect</span>
            </button>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="profile-container">
            <div className="profile-image">
              <div className="image-placeholder">
                <span>👨‍💻</span>
              </div>
            </div>
            <div className="tech-orbit">
              <div className="tech-item tech-1">React</div>
              <div className="tech-item tech-2">Rails</div>
              <div className="tech-item tech-3">JS</div>
              <div className="tech-item tech-4">CSS</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="hero-scroll">
        <div className="scroll-indicator">
          <span>Discover More</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;