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
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once (for CI)
- `npm run test:ui` - Run tests with visual UI
- `npm run test:coverage` - Generate test coverage report

### Dependencies Management
- `npm install` - Install all dependencies
- Dependencies are managed via npm with package-lock.json for version locking

## Project Architecture

### Technology Stack
- **React 18.2.0** with functional components and hooks
- **Vite 4.5.0** as build tool and dev server
- **React Router DOM 6.8.0** for routing (though currently uses hash navigation)
- **Modern CSS** with CSS custom properties for theming
- **ESLint 9** with flat config format for code quality
- **Vitest + Testing Library** for comprehensive component and integration testing
- **AWS Integration** - API Gateway + DynamoDB backend for data persistence

### Application Structure
This is a single-page application (SPA) with a section-based navigation system and interactive data components:

```
App.jsx (Router wrapper)
├── Header.jsx (Fixed navigation with smooth scrolling)
├── Hero.jsx (Landing section with personal intro)
├── About.jsx (Skills, experience, statistics)
├── Projects.jsx (Portfolio showcase with filtering)
├── DataManager.jsx (AWS-connected CRUD interface for data management)
├── Wheel.jsx (Interactive decision wheel with AWS data integration)
└── Contact.jsx (Contact form and information)
```

### Backend Architecture
- **AWS API Gateway**: RESTful API at `https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod`
- **DynamoDB**: NoSQL database with automatic timestamps
- **Service Layer**: `src/services/dataService.js` provides clean API abstraction
- **CORS Configuration**: Properly configured for cross-origin requests

### Component Patterns

#### State Management
- Uses React hooks (`useState`, `useEffect`, `useRef`) for local state
- **Custom Event System**: Cross-component communication via `window.dispatchEvent()` and `addEventListener()`
- **Async State Management**: Loading states, error handling, and data synchronization
- Each component manages its own state independently

#### Navigation System
- Hash-based navigation with smooth scrolling via `scrollIntoView({ behavior: 'smooth' })`
- Navigation controlled by `Header.jsx` component
- Each section has an `id` attribute for scroll targeting

#### Animation System
- Uses **Intersection Observer API** for scroll-triggered animations throughout all components
- Animation classes are added via `entry.target.classList.add('animate')`
- CSS handles the actual animation transitions with sophisticated timing

#### Responsive Design
- Mobile-first CSS approach
- Hamburger menu for mobile navigation in Header component
- CSS Grid and Flexbox for layouts
- **Multiple Breakpoints**: 375px, 768px, 1200px, 1600px, 2000px, 3440px+
- Touch-friendly design with proper target sizes

### CSS Architecture
- **Component-scoped CSS files** in `src/styles/` directory
- **CSS custom properties** for consistent theming in `App.css`
- **No CSS frameworks** (Bootstrap, Tailwind, etc.) - custom CSS only
- Import pattern: `import '../styles/ComponentName.css'`
- Advanced responsive patterns with CSS Container Queries support

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

#### DataManager Component
- **Full CRUD Operations**: Create, Read, Update, Delete entries
- **AWS Backend Integration**: Direct connection to DynamoDB via API Gateway
- **Real-time Updates**: Dispatches custom events for cross-component communication
- **Data Fields**: name, type, who, why
- **Comprehensive Error Handling**: User-friendly error states and feedback
- **Responsive Grid Layout**: Adapts to all viewport sizes

#### Wheel Component
- **Interactive SVG Wheel**: Custom-built spinning wheel using SVG path calculations
- **Dynamic Data Loading**: Pulls data from AWS backend
- **Type-based Filtering**: Filter entries with live count updates
- **Advanced Animations**: CSS-based spinning with physics-like deceleration
- **Mathematical Calculations**: Complex trigonometry for segment positioning
- **Event Integration**: Listens to DataManager updates via custom events

#### Performance Considerations
- Intersection Observer for efficient scroll animations
- Event-driven architecture for real-time updates
- Optimized re-renders with proper React patterns
- No lazy loading implemented yet
- No image optimization beyond placeholders

### Testing Infrastructure
- **Comprehensive Test Suite**: Full component testing with user interactions
- **Mock Infrastructure**: Proper mocking of browser APIs (IntersectionObserver, scrollIntoView, matchMedia)
- **Responsive Testing**: Viewport simulation for different screen sizes
- **Test Files Location**: `src/components/__tests__/`
- **Test Setup**: `src/test/setup.js` with sophisticated configuration

## CI/CD and Deployment

### GitHub Actions Workflow
- **Automated Testing**: Runs linting and tests on every push and PR
- **AWS S3 Deployment**: Automated deployment to S3 bucket
- **CloudFront Integration**: Support for CDN invalidation (currently commented)
- **Multi-environment Support**: Handles both push and PR workflows
- **Build Optimization**: Production builds with appropriate warning handling

### Deployment Configuration
- **Workflow File**: `.github/workflows/deploy.yml`
- **S3 Bucket**: Configured for static website hosting
- **Environment Secrets**: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

## Common Development Tasks

### Adding New Projects
Edit `src/components/Projects.jsx` and update the `projects` array with real project data.

### Managing Data Entries
- Use the DataManager component UI for CRUD operations
- Data persists in AWS DynamoDB
- Changes propagate to Wheel component automatically

### Customizing Personal Information
- **Hero section**: Update name, title, and description in `src/components/Hero.jsx`
- **About section**: Update skills, statistics, and bio in `src/components/About.jsx`
- **Contact section**: Update contact information in `src/components/Contact.jsx`

### Working with the AWS Backend
- **API Endpoint**: Update in `src/services/dataService.js` if needed
- **Error Handling**: Service layer provides structured error responses
- **Data Schema**: { id, name, type, who, why, timestamp }

### Styling Changes
- **Global theme colors**: Modify CSS custom properties in `src/App.css`
- **Component styles**: Edit individual CSS files in `src/styles/`
- **Responsive breakpoints**: Multiple breakpoints for various devices

### Running Tests
```bash
cd portfolio-site
npm run test           # Watch mode for development
npm run test:run       # Single run for CI
npm run test:ui        # Visual test UI
npm run test:coverage  # Generate coverage report
```

## File Structure
```
portfolio-site/
├── src/
│   ├── components/
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── DataManager.jsx    # AWS-connected CRUD interface
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── Projects.jsx
│   │   ├── Wheel.jsx           # Interactive decision wheel
│   │   └── __tests__/          # Component test files
│   ├── services/
│   │   └── dataService.js      # AWS API abstraction layer
│   ├── styles/                 # Component CSS files
│   ├── test/
│   │   └── setup.js            # Testing configuration
│   ├── hooks/                  # Empty, ready for custom hooks
│   ├── pages/                  # Empty, ready for page components
│   └── utils/                  # Empty, ready for utility functions
├── public/                     # Static assets
├── dist/                       # Build output (gitignored)
└── .github/
    └── workflows/
        └── deploy.yml          # CI/CD pipeline
```

## Important Implementation Notes
- **JavaScript with JSX** - No TypeScript
- **Comprehensive Testing** - Full test suite with Vitest and Testing Library
- **Live AWS Backend** - Production data persistence with DynamoDB
- **Cross-component Communication** - Custom event system for real-time updates
- **Production-ready CI/CD** - Complete GitHub Actions deployment pipeline
- Router is imported but navigation uses scroll-to-section instead of routing
- Form handling in Contact component is placeholder (no backend integration)
- All project images are placeholder URLs that need to be replaced