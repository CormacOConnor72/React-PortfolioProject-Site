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
    { 
      name: 'React', 
      description: 'Building modern, responsive user interfaces with hooks, context, and component-based architecture.',
      icon: '⚛️'
    },
    { 
      name: 'Ruby on Rails', 
      description: 'Full-stack web development with MVC architecture, ActiveRecord, and RESTful API design.',
      icon: '💎'
    },
    { 
      name: 'JavaScript', 
      description: 'Modern ES6+ development, async programming, DOM manipulation, and frontend/backend scripting.',
      icon: '🟨'
    },
    { 
      name: 'System Administration', 
      description: 'Server management, deployment automation, monitoring, and maintaining IT infrastructure.',
      icon: '⚙️'
    },
    { 
      name: 'CSS/SCSS', 
      description: 'Responsive design, animations, grid/flexbox layouts, and modern styling methodologies.',
      icon: '🎨'
    },
    { 
      name: 'Database Management', 
      description: 'SQL optimization, database design, PostgreSQL, and data modeling for scalable applications.',
      icon: '🗄️'
    },
    { 
      name: 'Git & Version Control', 
      description: 'Collaborative development workflows, branching strategies, and code review processes.',
      icon: '🔀'
    },
    { 
      name: 'Problem Solving', 
      description: 'Analytical thinking, debugging complex issues, and architecting efficient technical solutions.',
      icon: '🧩'
    }
  ];

  return (
    <section className="about">
      <div className="container">
        <div ref={sectionRef} className="about-content">
          <div className="about-text">
            <h2 className="section-title">About Me</h2>
            <p className="about-description">
              I&apos;m an Information Technology Systems Engineer with a Computer Science degree from 
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
            <h3>Technical Expertise</h3>
            <div className="skills-list">
              {skills.map((skill, index) => (
                <div key={index} className="skill-card">
                  <div className="skill-icon">{skill.icon}</div>
                  <div className="skill-content">
                    <h4 className="skill-name">{skill.name}</h4>
                    <p className="skill-description">{skill.description}</p>
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