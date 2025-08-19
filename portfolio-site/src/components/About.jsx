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
    { name: 'JavaScript', level: 90 },
    { name: 'React', level: 88 },
    { name: 'Node.js', level: 82 },
    { name: 'Python', level: 78 },
    { name: 'TypeScript', level: 75 },
    { name: 'CSS/SCSS', level: 85 },
    { name: 'MongoDB', level: 72 },
    { name: 'Git', level: 85 },
    { name: 'AWS', level: 70 },
    { name: 'Docker', level: 68 }
  ];

  return (
    <section className="about">
      <div className="container">
        <div ref={sectionRef} className="about-content">
          <div className="about-text">
            <h2 className="section-title">About Me</h2>
            <p className="about-description">
              I'm a passionate software engineer with expertise in full-stack development.
              I love building innovative web applications using modern technologies like React,
              Node.js, and cloud platforms. My focus is on creating efficient, scalable solutions
              that deliver exceptional user experiences.
            </p>
            <p className="about-description">
              I'm constantly learning and staying up-to-date with the latest industry trends.
              Whether it's exploring new frameworks, optimizing performance, or collaborating
              on challenging projects, I thrive on solving complex technical problems.
            </p>
            
            <div className="about-stats">
              <div className="stat">
                <h3>2+</h3>
                <p>Years Experience</p>
              </div>
              <div className="stat">
                <h3>25+</h3>
                <p>Projects Completed</p>
              </div>
              <div className="stat">
                <h3>10+</h3>
                <p>Technologies Used</p>
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