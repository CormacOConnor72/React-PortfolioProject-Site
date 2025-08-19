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
            Hi, I'm <span className="highlight">Cormac O'Connor</span>
          </h1>
          
          <p ref={subtitleRef} className="hero-subtitle">
            Information Technology Systems Engineer
          </p>
          
          <p className="hero-description">
            UL Computer Science graduate with expertise in React and Ruby on Rails. 
            I build efficient, user-focused applications that solve real business problems 
            and am ready to contribute to your team's success.
          </p>
          
          <div ref={ctaRef} className="hero-cta">
            <button className="btn btn-primary" onClick={scrollToProjects}>
              View My Projects
            </button>
            <button className="btn btn-secondary" onClick={scrollToContact}>
              Get In Touch
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
            <p className="profile-blurb">
              Computer Science Graduate <br/>
              React & Ruby on Rails Developer
            </p>
          </div>
        </div>
      </div>
      
      <div className="hero-scroll">
        <div className="scroll-indicator">
          <span>Scroll Down</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;