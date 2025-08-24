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
      name: 'Cloud Infrastructure', 
      description: 'Azure, Datto, Citrix Cloud, ControlUp, Active Directory/Entra ID, and VMware vSphere management.',
      icon: '☁️'
    },
    { 
      name: 'React & TypeScript', 
      description: 'Building scalable frontend applications serving 500k+ users with modern React patterns and TypeScript.',
      icon: '⚛️'
    },
    { 
      name: 'Ruby on Rails', 
      description: 'Full-stack web development with MVC architecture, ActiveRecord, and RESTful API design.',
      icon: '💎'
    },
    { 
      name: 'Programming Languages', 
      description: 'Proficient in Java, Python, JavaScript, C#/C++, SQL (PostgreSQL), Ruby, and Bash/Shell scripting.',
      icon: '💻'
    },
    { 
      name: 'System Administration', 
      description: 'Linux (Debian/Kali), Windows, macOS administration, Docker containerization, and IT infrastructure.',
      icon: '⚙️'
    },
    { 
      name: 'Development Tools', 
      description: 'Git, VS Code, IntelliJ, PyCharm, Visual Studio, Firebase, Unity, and comprehensive testing frameworks.',
      icon: '🛠️'
    },
    { 
      name: 'Data & Analytics', 
      description: 'Pandas, NumPy, Matplotlib, Jupyter Notebook for data science and AI application development.',
      icon: '📊'
    },
    { 
      name: 'Game Development', 
      description: 'Unity engine, C# scripting, 3D modeling with Blender, physics, and level design for interactive experiences.',
      icon: '🎮'
    }
  ];

  return (
    <section className="about">
      <div className="container">
        <div ref={sectionRef} className="about-content">
          <div className="about-text">
            <h2 className="section-title">About Me</h2>
            <p className="about-description">
              I&apos;m an IT Systems Engineer with a Bachelor of Science in Computer Game Development 
              from the University of Limerick (Second Class Honours Grade 1). I specialize in cloud 
              infrastructure management with Azure, React frontend development, and Ruby on Rails backend systems.
            </p>
            <p className="about-description">
              Currently working at John Paul Construction managing IT cloud infrastructure and maintaining 
              systems for 1000+ devices. Previously worked as a Full Stack Software Engineer Intern at 
              WpEngine, contributing to a customer-facing web portal serving 500k+ users using React, 
              TypeScript, and Ruby on Rails.
            </p>
            
            <div className="about-stats">
              <div className="stat">
                <h3>2024</h3>
                <p>UL Graduate</p>
              </div>
              <div className="stat">
                <h3>500k+</h3>
                <p>Users Served</p>
              </div>
              <div className="stat">
                <h3>1000+</h3>
                <p>Devices Managed</p>
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