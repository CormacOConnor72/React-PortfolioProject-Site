import { useEffect, useRef } from 'react';
import '../styles/About.css';

const About = () => {
  const sectionRef = useRef(null);
  const skillsRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    if (sectionRef.current) observer.observe(sectionRef.current);
    if (skillsRef.current) observer.observe(skillsRef.current);

    return () => observer.disconnect();
  }, []);

  const skills = [
    { name: 'React', level: 90 },
    { name: 'Ruby on Rails', level: 85 },
    { name: 'JavaScript', level: 88 },
    { name: 'CSS/SCSS', level: 82 },
    { name: 'HTML5', level: 85 },
    { name: 'Git', level: 80 },
    { name: 'SQL', level: 75 },
    { name: 'Python', level: 70 },
    { name: 'System Administration', level: 78 },
    { name: 'Problem Solving', level: 90 }
  ];

  return (
    <section className="about">
      <div className="container">
        <div ref={sectionRef} className="about-content">
          <div className="about-text">
            <h2 className="section-title">About Me</h2>
            <p className="about-description">
              I'm an Information Technology Systems Engineer with a Computer Science degree from 
              the University of Limerick. I specialize in building web applications using React 
              for frontend development and Ruby on Rails for backend systems.
            </p>
            <p className="about-description">
              My passion lies in creating efficient, reliable systems and solving complex technical 
              challenges. I enjoy working with modern web technologies and am always eager to learn 
              new tools and frameworks to improve my development skills.
            </p>
            
            <div className="about-stats">
              <div className="stat">
                <h3>UL</h3>
                <p>Computer Science Graduate</p>
              </div>
              <div className="stat">
                <h3>React</h3>
                <p>Frontend Specialist</p>
              </div>
              <div className="stat">
                <h3>Rails</h3>
                <p>Backend Experience</p>
              </div>
            </div>
          </div>

          <div ref={skillsRef} className="about-skills">
            <h3>Technical Skills</h3>
            <div className="skills-grid">
              {skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div className="skill-header">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-percentage">{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;