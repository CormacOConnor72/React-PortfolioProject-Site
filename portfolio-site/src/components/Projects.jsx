import { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/Projects.css';

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const sectionRef = useRef(null);

  const projects = useMemo(() => [
    {
      id: 1,
      title: 'Grid Runners',
      description: 'A first-person shooter game developed in Unity with custom models, physics, scripting, level design, and UI. Final year project that received a B1 grade.',
      image: '/api/placeholder/400/250',
      technologies: ['Unity', 'C#', 'Blender', 'Git', 'Obsidian'],
      category: 'game',
      github: 'https://github.com/CormacOConnor72',
      live: null,
      featured: true
    },
    {
      id: 2,
      title: 'Flask AI Sentiment Site',
      description: 'Web application using Flask that allows text input for AI-powered emotion and sentiment detection. Built using Agile methodologies with version control.',
      image: '/api/placeholder/400/250',
      technologies: ['Flask', 'Python', 'AI API', 'Git', 'HTML/CSS'],
      category: 'fullstack',
      github: 'https://github.com/CormacOConnor72',
      live: null,
      featured: true
    },
    {
      id: 3,
      title: 'WpEngine Customer Portal',
      description: 'Contributed to a customer-facing web portal serving 500k+ users as part of Team Athena. Built with React, TypeScript, and Ruby on Rails in an Agile environment.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'TypeScript', 'Ruby on Rails', 'PostgreSQL'],
      category: 'fullstack',
      github: null,
      live: null,
      featured: true
    },
    {
      id: 4,
      title: 'IT Infrastructure Management',
      description: 'Professional experience managing cloud infrastructure for 1000+ devices including Azure, Datto, Citrix Cloud, and Active Directory systems.',
      image: '/api/placeholder/400/250',
      technologies: ['Azure', 'Active Directory', 'Citrix Cloud', 'Datto', 'ControlUp'],
      category: 'infrastructure',
      github: null,
      live: null,
      featured: false
    },
    {
      id: 5,
      title: 'Portfolio Website',
      description: 'This responsive portfolio website built with React and modern CSS. Features smooth animations, optimized performance, and showcases my professional work.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'CSS3', 'Vite', 'JavaScript'],
      category: 'frontend',
      github: 'https://github.com/CormacOConnor72',
      live: null,
      featured: false
    },
    {
      id: 6,
      title: 'ISO27001 Documentation System',
      description: 'Led the creation and maintenance of IT processes and departmental procedures documentation that contributed to company achieving ISO27001 certification.',
      image: '/api/placeholder/400/250',
      technologies: ['Documentation', 'Process Management', 'ISO27001', 'IT Security'],
      category: 'documentation',
      github: null,
      live: null,
      featured: false
    }
  ], []);

  const categories = [
    { id: 'all', label: 'All Projects' },
    { id: 'fullstack', label: 'Full Stack' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'game', label: 'Game Dev' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'documentation', label: 'Documentation' }
  ];

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => project.category === activeFilter));
    }
  }, [activeFilter, projects]);

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

    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [filteredProjects]);

  return (
    <section className="projects">
      <div className="container">
        <div ref={sectionRef} className="projects-header">
          <h2 className="section-title">My Projects</h2>
          <p className="section-subtitle">
            Here are some of my recent projects that showcase my skills and experience
          </p>
        </div>

        <div className="filter-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`filter-btn ${activeFilter === category.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className={`project-card ${project.featured ? 'featured' : ''}`}>
              <div className="project-image">
                <img src={project.image} alt={project.title} />
                <div className="project-overlay">
                  <div className="project-links">
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                        <span>GitHub</span>
                      </a>
                    )}
                    {project.live && (
                      <a href={project.live} target="_blank" rel="noopener noreferrer" className="project-link">
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-technologies">
                  {project.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;