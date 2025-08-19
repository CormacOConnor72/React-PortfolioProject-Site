import { useState, useEffect, useRef } from 'react';
import '../styles/Projects.css';

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const sectionRef = useRef(null);

  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with React, Node.js, and MongoDB. Features include user authentication, payment processing, and admin dashboard.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      category: 'fullstack',
      github: 'https://github.com/yourusername/ecommerce',
      live: 'https://yourecommerce.com',
      featured: true
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'A responsive task management application built with React and Firebase. Includes real-time updates, drag-and-drop functionality, and team collaboration.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'Firebase', 'CSS3', 'Context API'],
      category: 'frontend',
      github: 'https://github.com/yourusername/taskapp',
      live: 'https://yourtaskapp.com',
      featured: true
    },
    {
      id: 3,
      title: 'Weather Dashboard',
      description: 'A clean weather application with location-based forecasts, historical data, and interactive charts using OpenWeather API.',
      image: '/api/placeholder/400/250',
      technologies: ['JavaScript', 'Chart.js', 'OpenWeather API', 'CSS3'],
      category: 'frontend',
      github: 'https://github.com/yourusername/weather',
      live: 'https://yourweather.com',
      featured: false
    },
    {
      id: 4,
      title: 'REST API Server',
      description: 'A robust REST API built with Express.js and PostgreSQL. Features JWT authentication, rate limiting, and comprehensive documentation.',
      image: '/api/placeholder/400/250',
      technologies: ['Node.js', 'Express', 'PostgreSQL', 'JWT'],
      category: 'backend',
      github: 'https://github.com/yourusername/api',
      live: null,
      featured: false
    },
    {
      id: 5,
      title: 'Portfolio Website',
      description: 'A responsive portfolio website built with React and modern CSS. Features smooth animations, dark mode, and optimized performance.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'CSS3', 'Vite', 'Responsive Design'],
      category: 'frontend',
      github: 'https://github.com/yourusername/portfolio',
      live: 'https://yourportfolio.com',
      featured: false
    },
    {
      id: 6,
      title: 'Social Media Dashboard',
      description: 'A comprehensive social media management tool with analytics, post scheduling, and multi-platform integration.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'Node.js', 'Socket.io', 'Chart.js'],
      category: 'fullstack',
      github: 'https://github.com/yourusername/social-dashboard',
      live: 'https://yoursocial.com',
      featured: true
    }
  ];

  const categories = [
    { id: 'all', label: 'All Projects' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'fullstack', label: 'Full Stack' }
  ];

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => project.category === activeFilter));
    }
  }, [activeFilter]);

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
          {filteredProjects.map((project, index) => (
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