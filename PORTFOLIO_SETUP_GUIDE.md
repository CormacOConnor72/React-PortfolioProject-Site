# React Portfolio Website - Advanced Web Development Lab

## 🎯 Project Overview

This is a comprehensive React portfolio website built with modern web development technologies and best practices. The project serves as an advanced web development lab, demonstrating responsive design, component architecture, state management, and modern CSS techniques.

### 🚀 Live Demo
- Development Server: `npm run dev`
- Production Build: `npm run build && npm run preview`

---

## 📋 Table of Contents

1. [Technologies Used](#technologies-used)
2. [Project Structure](#project-structure)
3. [Installation & Setup](#installation--setup)
4. [Component Architecture](#component-architecture)
5. [Styling System](#styling-system)
6. [Features Breakdown](#features-breakdown)
7. [Testing](#testing)
8. [Development Workflow](#development-workflow)
9. [Customization Guide](#customization-guide)
10. [Performance Optimization](#performance-optimization)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🛠 Technologies Used

### Core Technologies
- **React 18.2.0** - Stable version with all modern features
- **Vite 4.5.0** - Fast build tool and development server
- **React Router DOM 6.8.0** - Client-side routing (though we use smooth scrolling)
- **Modern CSS** - CSS Variables, Grid, Flexbox, animations

### Development Tools
- **ESLint** - Code linting and formatting
- **Vitest** - Fast unit testing framework
- **Testing Library** - React component testing utilities
- **Modern JavaScript (ES6+)** - Latest JavaScript features
- **CSS3** - Advanced styling with animations and responsive design

### Key Features
- 📱 **Fully Responsive Design** - Mobile-first approach
- 🌙 **Dark Mode Support** - CSS variables for theme switching
- ⚡ **Performance Optimized** - Lazy loading, animations, smooth scrolling
- 🎨 **Modern UI/UX** - Clean design with hover effects and animations
- 📧 **Contact Form** - Functional contact form with validation
- 🔍 **Project Filtering** - Dynamic project filtering system
- 📊 **Skills Visualization** - Animated progress bars for skills

---

## 📁 Project Structure

```
portfolio-site/
├── public/
│   ├── vite.svg                 # Vite logo
│   └── index.html              # HTML template
├── src/
│   ├── components/             # React components
│   │   ├── Header.jsx         # Navigation header
│   │   ├── Hero.jsx           # Landing section
│   │   ├── About.jsx          # About section
│   │   ├── Projects.jsx       # Projects showcase
│   │   ├── Contact.jsx        # Contact form
│   │   └── __tests__/         # Component tests
│   │       ├── Header.test.jsx
│   │       ├── Contact.test.jsx
│   │       ├── Projects.test.jsx
│   │       └── App.test.jsx
│   ├── styles/                # Component styles
│   │   ├── Header.css         # Header styling
│   │   ├── Hero.css           # Hero section styling
│   │   ├── About.css          # About section styling
│   │   ├── Projects.css       # Projects styling
│   │   └── Contact.css        # Contact form styling
│   ├── assets/                # Static assets
│   │   └── react.svg          # React logo
│   ├── test/                  # Test configuration
│   │   └── setup.js           # Test setup and mocks
│   ├── __tests__/             # General tests
│   │   └── responsive.test.js # Responsive design tests
│   ├── hooks/                 # Custom React hooks (future use)
│   ├── utils/                 # Utility functions (future use)
│   ├── App.jsx                # Main app component
│   ├── App.css                # Global styles
│   ├── main.jsx               # App entry point
│   └── index.css              # Base CSS reset
├── eslint.config.js           # ESLint configuration
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies and scripts
└── README.md                  # Project documentation
```

---

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v18.19.0 or later)
- **npm** (v9.2.0 or later)
- **Git** (for version control)

### Step 1: Clone or Navigate to Project
```bash
cd portfolio-site
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

The development server will start at `http://localhost:5173`

### Step 4: Build for Production
```bash
npm run build
```

### Step 5: Preview Production Build
```bash
npm run preview
```

---

## 🏗 Component Architecture

### App.jsx - Main Application
**Location:** `src/App.jsx`

```jsx
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
// ... other imports

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <section id="home"><Hero /></section>
          <section id="about"><About /></section>
          <section id="projects"><Projects /></section>
          <section id="contact"><Contact /></section>
        </main>
      </div>
    </Router>
  );
}
```

**Key Features:**
- Single-page application structure
- Section-based navigation with smooth scrolling
- Router setup for future multi-page expansion

### Header.jsx - Navigation Component
**Location:** `src/components/Header.jsx`

**Key Features:**
- Fixed position header with scroll effects
- Responsive hamburger menu for mobile
- Smooth scrolling navigation
- Active state management

**Technical Implementation:**
```jsx
const [isScrolled, setIsScrolled] = useState(false);
const [isMenuOpen, setIsMenuOpen] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 50);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### Hero.jsx - Landing Section
**Location:** `src/components/Hero.jsx`

**Key Features:**
- Intersection Observer API for animations
- Responsive grid layout
- Call-to-action buttons with smooth scrolling
- Floating animation for profile image

**Technical Implementation:**
```jsx
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
}, []);
```

### About.jsx - About Section
**Location:** `src/components/About.jsx`

**Key Features:**
- Animated skill progress bars
- Statistics cards with hover effects
- Responsive grid layout
- Intersection Observer animations

**Skills System:**
```jsx
const skills = [
  { name: 'JavaScript', level: 90 },
  { name: 'React', level: 85 },
  // ... more skills
];
```

### Projects.jsx - Portfolio Showcase
**Location:** `src/components/Projects.jsx`

**Key Features:**
- Dynamic project filtering system
- Project data management
- Hover effects and overlays
- Responsive grid layout

**Filtering System:**
```jsx
const [activeFilter, setActiveFilter] = useState('all');
const [filteredProjects, setFilteredProjects] = useState([]);

useEffect(() => {
  if (activeFilter === 'all') {
    setFilteredProjects(projects);
  } else {
    setFilteredProjects(projects.filter(project => project.category === activeFilter));
  }
}, [activeFilter]);
```

### Contact.jsx - Contact Form
**Location:** `src/components/Contact.jsx`

**Key Features:**
- Form state management
- Form validation
- Submit handling with loading states
- Contact information display

**Form Handling:**
```jsx
const [formData, setFormData] = useState({
  name: '', email: '', message: ''
});
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitStatus, setSubmitStatus] = useState('');
```

---

## 🎨 Styling System

### CSS Variables (Custom Properties)
**Location:** `src/App.css`

The project uses CSS custom properties for consistent theming:

```css
:root {
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --secondary-color: #64748b;
  --accent-color: #06b6d4;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --background: #ffffff;
  --background-secondary: #f8fafc;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Dark Mode Support
```css
[data-theme="dark"] {
  --primary-color: #60a5fa;
  --text-primary: #f1f5f9;
  --background: #0f172a;
  --background-secondary: #1e293b;
}
```

### Responsive Design Strategy

#### Mobile-First Approach
```css
/* Base styles for mobile */
.hero-title {
  font-size: 2.5rem;
}

/* Tablet and desktop */
@media (min-width: 768px) {
  .hero-title {
    font-size: 3.5rem;
  }
}
```

#### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Animation System

#### Intersection Observer Animations
```css
.animate {
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Hover Effects
```css
.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

## ⚡ Features Breakdown

### 1. Responsive Navigation
- **Fixed header** with backdrop blur effect
- **Hamburger menu** for mobile devices
- **Smooth scrolling** to sections
- **Active state** management

### 2. Hero Section
- **Animated text** with staggered delays
- **Profile image** with floating animation
- **Call-to-action buttons** with hover effects
- **Scroll indicator** with bounce animation

### 3. About Section
- **Statistics cards** with hover animations
- **Skills progress bars** with animated loading
- **Responsive grid** layout
- **Intersection Observer** animations

### 4. Projects Section
- **Dynamic filtering** by category (Frontend, Backend, Full Stack)
- **Project cards** with hover overlays
- **Live demo and GitHub links**
- **Technology tags** for each project
- **Featured project** highlighting

### 5. Contact Section
- **Functional contact form** with validation
- **Form state management** (loading, success, error)
- **Contact methods** with hover animations
- **Responsive form layout**

---

## 🧪 Testing

### Testing Framework
The project uses **Vitest** as the testing framework along with **React Testing Library** for component testing. This provides:

- **Fast execution** - Vitest runs tests faster than Jest
- **Vite integration** - Native support for Vite's build system
- **Modern features** - ES modules, TypeScript support out of the box
- **Component testing** - React Testing Library for user-centric tests

### Test Structure
```
src/
├── components/
│   └── __tests__/          # Component tests
│       ├── Header.test.jsx
│       ├── Contact.test.jsx
│       ├── Projects.test.jsx
│       └── App.test.jsx
├── __tests__/              # General tests
│   └── responsive.test.js
└── test/
    └── setup.js            # Test configuration and mocks
```

### Available Test Commands

#### Development Testing
```bash
npm run test              # Run tests in watch mode (development)
npm run test:ui           # Run tests with visual UI interface
```

#### CI/Production Testing
```bash
npm run test:run          # Run tests once (for CI/CD)
npm run test:coverage     # Run tests with coverage report
```

### Test Categories

#### 1. Component Tests
**Location:** `src/components/__tests__/`

Tests individual React components for:
- **Rendering** - Components render without crashing
- **Props handling** - Components receive and use props correctly
- **User interactions** - Clicks, form submissions, navigation
- **State management** - Component state updates properly
- **Accessibility** - Proper ARIA labels and roles

**Example: Header Component Test**
```javascript
it('toggles mobile menu when hamburger is clicked', async () => {
  const user = userEvent.setup()
  renderWithRouter(<Header />)
  
  const hamburger = screen.getByRole('button', { name: /toggle menu/i })
  await user.click(hamburger)
  
  expect(nav).toHaveClass('nav-open')
})
```

#### 2. Integration Tests
**Location:** `src/components/__tests__/App.test.jsx`

Tests how components work together:
- **Section navigation** - Smooth scrolling between sections
- **Overall app structure** - Main sections render correctly
- **Router integration** - URL handling and navigation

#### 3. Form Validation Tests
**Location:** `src/components/__tests__/Contact.test.jsx`

Tests contact form functionality:
- **Field validation** - Required fields, email format
- **Form submission** - Loading states, success/error messages
- **User experience** - Form clearing, accessibility

**Example: Form Validation Test**
```javascript
it('validates required fields on submit', async () => {
  const user = userEvent.setup()
  render(<Contact />)
  
  const submitButton = screen.getByRole('button', { name: /send message/i })
  await user.click(submitButton)
  
  expect(screen.getByLabelText(/name/i)).toBeInvalid()
  expect(screen.getByLabelText(/email/i)).toBeInvalid()
})
```

#### 4. Responsive Design Tests
**Location:** `src/__tests__/responsive.test.js`

Tests responsive behavior:
- **Viewport handling** - Different screen sizes (mobile, tablet, desktop, ultrawide)
- **Container constraints** - Max-width limits at different breakpoints
- **Accessibility** - Touch target sizes, spacing requirements

### Testing Best Practices

#### Component Testing Principles
1. **User-centric testing** - Test what users see and do, not implementation details
2. **Accessibility testing** - Use semantic queries (getByRole, getByLabelText)
3. **Async handling** - Properly wait for state updates and DOM changes
4. **Mock external dependencies** - IntersectionObserver, scroll functions

#### Test Organization
```javascript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  it('describes specific behavior', () => {
    // Test implementation
  })
})
```

### Mocked APIs and Browser Features

The test setup includes mocks for:
- **IntersectionObserver** - For scroll-based animations
- **scrollIntoView** - For smooth scrolling navigation
- **matchMedia** - For responsive design queries
- **window.scrollTo** - For programmatic scrolling

### Test Coverage Goals

The test suite covers:
- ✅ **Navigation functionality** - Header links, mobile menu
- ✅ **Form validation** - Contact form fields and submission
- ✅ **Project filtering** - Dynamic project category filtering
- ✅ **Responsive behavior** - Different viewport sizes
- ✅ **Core app structure** - Main sections and routing

### Continuous Integration Testing

The deployment pipeline (`deploy.yml`) now includes:
```yaml
- name: Run ESLint
  run: npm run lint
  
- name: Run tests
  run: npm run test:run
  
- name: Build React app
  run: npm run build
```

This ensures:
1. **Code quality** - ESLint checks pass
2. **Test validation** - All tests pass
3. **Build verification** - App builds successfully
4. **Deployment** - Only deploys if all checks pass

### Writing New Tests

#### For New Components
1. Create test file: `src/components/__tests__/NewComponent.test.jsx`
2. Test rendering, props, user interactions
3. Follow existing patterns for consistency

#### For New Features
1. Add feature-specific tests to existing component tests
2. Create integration tests if feature spans multiple components
3. Update responsive tests for new breakpoints or layouts

#### Test Template
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewComponent from '../NewComponent'

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('handles user interaction', async () => {
    const user = userEvent.setup()
    render(<NewComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(/* expected behavior */).toBeTruthy()
  })
})
```

---

## 🔄 Development Workflow

### Available Scripts

#### Development
```bash
npm run dev          # Start development server
```

#### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Code Quality
```bash
npm run lint         # Run ESLint
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once (for CI)
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Code Style Guidelines

#### Component Structure
```jsx
import { useState, useEffect } from 'react';
import './ComponentName.css';

const ComponentName = () => {
  // State declarations
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

#### CSS Organization
```css
/* Component base styles */
.component-name {
  /* Layout properties */
  /* Visual properties */
  /* Animation properties */
}

/* Modifiers */
.component-name.modifier {
  /* Modifier styles */
}

/* Children elements */
.component-name__element {
  /* Element styles */
}

/* Responsive design */
@media (min-width: 768px) {
  .component-name {
    /* Responsive styles */
  }
}
```

---

## 🎛 Customization Guide

### 1. Personal Information

#### Update Hero Section
**File:** `src/components/Hero.jsx`

```jsx
<h1 className="hero-title">
  Hi, I'm <span className="highlight">Your Name</span>
</h1>
<p className="hero-subtitle">
  Your Professional Title
</p>
```

#### Update About Section
**File:** `src/components/About.jsx`

```jsx
const skills = [
  { name: 'Your Skill', level: 90 },
  // Add your skills here
];

// Update statistics
<div className="stat">
  <h3>3+</h3>
  <p>Years Experience</p>
</div>
```

### 2. Projects Data

#### Add Your Projects
**File:** `src/components/Projects.jsx`

```jsx
const projects = [
  {
    id: 1,
    title: 'Your Project Name',
    description: 'Project description...',
    image: '/path/to/your/image.jpg',
    technologies: ['React', 'Node.js', 'MongoDB'],
    category: 'fullstack', // 'frontend', 'backend', 'fullstack'
    github: 'https://github.com/yourusername/project',
    live: 'https://yourproject.com',
    featured: true // Set to true for featured projects
  },
  // Add more projects...
];
```

### 3. Contact Information

#### Update Contact Details
**File:** `src/components/Contact.jsx`

```jsx
const contactInfo = [
  {
    icon: '📧',
    title: 'Email',
    details: 'your.email@example.com',
    link: 'mailto:your.email@example.com'
  },
  // Update with your information
];
```

### 4. Color Theme

#### Customize Colors
**File:** `src/App.css`

```css
:root {
  --primary-color: #your-color;
  --accent-color: #your-accent;
  /* Update other colors as needed */
}
```

### 5. Images and Assets

#### Profile Image
Replace the placeholder in `src/components/Hero.jsx`:
```jsx
<div className="image-placeholder">
  <img src="/path/to/your/photo.jpg" alt="Your Name" />
</div>
```

#### Project Images
Update image paths in project data with your project screenshots.

---

## ⚡ Performance Optimization

### 1. Image Optimization
- Use WebP format for images
- Implement lazy loading for project images
- Optimize image sizes for different screen densities

### 2. Code Splitting
```jsx
// Example: Lazy load components
const About = lazy(() => import('./components/About'));
```

### 3. CSS Optimization
- Use CSS custom properties for consistent theming
- Minimize CSS with build tools
- Use efficient selectors

### 4. JavaScript Optimization
- Remove unused dependencies
- Use React.memo for expensive components
- Implement debouncing for scroll events

### 5. Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze
```

---

## 🚀 Deployment

### AWS S3 with GitHub Actions (Recommended)
Automated deployment pipeline that builds and deploys to AWS S3 on every push to main branch.

#### Prerequisites
- AWS account with S3 bucket
- GitHub repository

#### Setup Steps

**1. Create S3 Bucket**
- Create bucket with static website hosting enabled
- Set index document to `index.html`
- Configure bucket policy for public read access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

**2. AWS IAM Setup**
Create IAM user with programmatic access and attach policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR-BUCKET-NAME",
                "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            ]
        }
    ]
}
```

**3. GitHub Secrets Configuration**
Add these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - Your bucket region (e.g., `us-east-1`)
- `AWS_S3_BUCKET_NAME` - Your bucket name (without s3:// prefix)

**4. GitHub Actions Workflow**
The project includes `.github/workflows/deploy.yml` that automatically:
- Triggers on push to main branch
- Builds the React app from `portfolio-site/` directory
- Deploys to S3 using `aws s3 sync`
- Removes old files with `--delete` flag

**5. Deployment Process**
```bash
# Make changes to your portfolio
git add .
git commit -m "Update portfolio"
git push origin main
```

The GitHub Action will automatically build and deploy your changes!

**6. Access Your Site**
Your portfolio will be available at:
`http://YOUR-BUCKET-NAME.s3-website-REGION.amazonaws.com`

### Alternative Deployment Options

#### Vercel
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set root directory to `portfolio-site`
4. Deploy automatically on push

#### Netlify
1. Build the project: `npm run build`
2. Upload `dist` folder to Netlify
3. Configure redirects for SPA

#### GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
```json
{
  "homepage": "https://yourusername.github.io/portfolio",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```
3. Deploy: `npm run deploy`

#### Custom Server
1. Build: `npm run build`
2. Serve `dist` folder with any static server
3. Configure proper redirects for SPA routing

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Node Version Compatibility
**Error:** `EBADENGINE Unsupported engine`
**Solution:** Update Node.js to v20.19.0 or later

#### 2. React Router Issues
**Error:** Blank page on refresh
**Solution:** Configure server redirects for SPA

#### 3. CSS Not Loading
**Solution:** Check import paths and file extensions

#### 4. Build Errors
**Solution:** 
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

#### 5. Animation Performance
**Solution:** 
- Use `transform` and `opacity` for animations
- Add `will-change` property for animated elements

### Development Tips

1. **Hot Reload Issues:** Restart dev server if changes aren't reflecting
2. **CSS Debugging:** Use browser dev tools to inspect CSS variables
3. **Component Testing:** Test components in isolation
4. **Responsive Testing:** Use browser dev tools device simulation

---

## 📚 Learning Objectives

This project demonstrates:

### React Concepts
- Functional components with hooks
- State management with useState
- Side effects with useEffect
- Event handling and prop passing
- Component composition

### Modern JavaScript
- ES6+ syntax (arrow functions, destructuring, modules)
- Async/await patterns
- Array methods (map, filter)
- Template literals

### CSS Techniques
- CSS Grid and Flexbox
- CSS custom properties (variables)
- Responsive design principles
- CSS animations and transitions
- Mobile-first design

### Web APIs
- Intersection Observer API
- Scroll events
- Local Storage (for future theme persistence)

### Build Tools
- Vite configuration
- ESLint setup
- Module bundling concepts

### Best Practices
- Component organization
- File structure
- Code splitting
- Performance optimization
- Accessibility considerations

---

## 🎯 Next Steps & Enhancements

### Immediate Improvements
1. **Add Form Backend:** Integrate with EmailJS or Formspree
2. **Image Optimization:** Add proper image loading
3. **SEO Optimization:** Add meta tags and structured data
4. **Theme Toggle:** Implement dark/light mode switcher

### Advanced Features
1. **Blog Section:** Add a blog with markdown support
2. **CMS Integration:** Connect with headless CMS
3. **Analytics:** Add Google Analytics or similar
4. **PWA Features:** Service worker, offline support
5. **Testing:** Add unit and integration tests

### Performance Enhancements
1. **Lazy Loading:** Implement intersection observer for images
2. **Code Splitting:** Split components into separate chunks
3. **Caching Strategy:** Implement proper caching headers
4. **Bundle Optimization:** Analyze and optimize bundle size

---

## 📖 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

### Design Inspiration
- [Dribbble](https://dribbble.com/tags/portfolio)
- [Awwwards](https://www.awwwards.com/)
- [Behance](https://www.behance.net/)

### Tools & Libraries
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [CSS Grid Generator](https://css-grid-generator.netlify.app/)
- [Flexbox Froggy](https://flexboxfroggy.com/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Happy Coding! 🚀**

*This project serves as a comprehensive example of modern React development practices and can be used as a starting point for building professional portfolio websites.*