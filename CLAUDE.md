# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The main application is located in the `portfolio-site/` directory. Always change to this directory before running commands:

```bash
cd portfolio-site
```

### Core Development Commands
- `npm run dev` - Start development server (runs on localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

### Dependencies Management
- `npm install` - Install all dependencies
- Dependencies are managed via npm with package-lock.json for version locking

## Project Architecture

### Technology Stack
- **React 18.2.0** with functional components and hooks
- **Vite 4.5.0** as build tool and dev server
- **React Router DOM 6.8.0** for routing (though currently uses hash navigation)
- **Modern CSS** with CSS custom properties for theming
- **ESLint** for code quality

### Application Structure
This is a single-page application (SPA) with a section-based navigation system:

```
App.jsx (Router wrapper)
├── Header.jsx (Fixed navigation with smooth scrolling)
├── Hero.jsx (Landing section with personal intro)
├── About.jsx (Skills, experience, statistics)
├── Projects.jsx (Portfolio showcase with filtering)
└── Contact.jsx (Contact form and information)
```

### Component Patterns

#### State Management
- Uses React hooks (`useState`, `useEffect`, `useRef`) for local state
- No global state management library (Redux, Zustand, etc.)
- Each component manages its own state independently

#### Navigation System
- Hash-based navigation with smooth scrolling via `scrollIntoView({ behavior: 'smooth' })`
- Navigation controlled by `Header.jsx` component
- Each section has an `id` attribute for scroll targeting

#### Animation System
- Uses **Intersection Observer API** for scroll-triggered animations
- Animation classes are added via `entry.target.classList.add('animate')`
- CSS handles the actual animation transitions

#### Responsive Design
- Mobile-first CSS approach
- Hamburger menu for mobile navigation in Header component
- CSS Grid and Flexbox for layouts

### CSS Architecture
- **Component-scoped CSS files** in `src/styles/` directory
- **CSS custom properties** for consistent theming in `App.css`
- **No CSS frameworks** (Bootstrap, Tailwind, etc.) - custom CSS only
- Import pattern: `import '../styles/ComponentName.css'`

### Key Implementation Details

#### Header Component
- Tracks scroll position to add/remove `scrolled` class
- Mobile hamburger menu with `isMenuOpen` state
- Smooth scrolling navigation to page sections

#### Hero Component
- Personal information hardcoded (name: "Cormac O'Connor")
- Intersection Observer for animation triggers
- Profile placeholder using emoji (👨‍💻)

#### Projects Component
- **Filtering system** with categories: 'all', 'frontend', 'backend', 'fullstack'
- **Featured projects** can be highlighted with `featured: true`
- **Sample projects** are hardcoded in component (replace with real projects)
- Uses placeholder images from `/api/placeholder/400/250`

#### Performance Considerations
- Intersection Observer for efficient scroll animations
- No lazy loading implemented yet
- No image optimization beyond placeholders

## Common Development Tasks

### Adding New Projects
Edit `src/components/Projects.jsx` and update the `projects` array with real project data.

### Customizing Personal Information
- **Hero section**: Update name, title, and description in `src/components/Hero.jsx`
- **About section**: Update skills, statistics, and bio in `src/components/About.jsx`
- **Contact section**: Update contact information in `src/components/Contact.jsx`

### Styling Changes
- **Global theme colors**: Modify CSS custom properties in `src/App.css`
- **Component styles**: Edit individual CSS files in `src/styles/`
- **Responsive breakpoints**: Currently uses 768px for mobile/desktop split

### Building and Deployment
The project includes AWS S3 deployment configuration via GitHub Actions, but the workflow file is referenced in documentation only.

## File Structure Notes
- Main app code in `portfolio-site/src/`
- Components in `portfolio-site/src/components/`
- Styles in `portfolio-site/src/styles/`
- Public assets in `portfolio-site/public/`
- Build output goes to `portfolio-site/dist/`

## Important Implementation Notes
- No TypeScript - uses plain JavaScript with JSX
- No testing framework configured
- Router is imported but navigation uses scroll-to-section instead of routing
- Form handling in Contact component is placeholder (no backend integration)
- All project images are placeholder URLs that need to be replaced