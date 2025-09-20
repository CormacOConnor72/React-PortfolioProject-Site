# CLAUDE.md
## My name is Cormac
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
- **AWS Lambda Functions**: Serverless compute layer in `eu-north-1` region
  - **Entry Management**: `portfolio-create-entry`, `portfolio-delete-entry`, `portfolio-get-entries`
  - **Spin Analytics**: `recordSpin`, `getSpinHistory`, `getGlobalMetrics`, `clearSpinHistory`
- **DynamoDB**: NoSQL database with automatic timestamps in `eu-north-1`
  - **SpinHistory**: Tracks wheel usage and analytics
  - **portfolio-data-entries**: Stores DataManager entries with fields: name, type, who, why
- **Service Layer**: `src/services/dataService.js` provides clean API abstraction
- **CORS Configuration**: Properly configured for cross-origin requests
- **Cross-Region Setup**: API Gateway (us-east-1) → Lambda Functions (eu-north-1) for CloudFront compatibility

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
- **Dynamic Viewport Management**: JavaScript-based system for in-app browser compatibility
- **Smart Grid Sizing**: CSS custom properties that adapt to viewport changes in real-time
- Hamburger menu for mobile navigation in Header component
- CSS Grid and Flexbox for layouts
- **Multiple Breakpoints**: 375px, 768px, 1200px, 1600px, 2000px, 3440px+
- **In-app Browser Detection**: Special handling for LinkedIn, Instagram, Facebook, WeChat browsers
- Touch-friendly design with proper target sizes

### CSS Architecture
- **Component-scoped CSS files** in `src/styles/` directory
- **CSS custom properties** for consistent theming in `App.css`
- **Dynamic CSS Variables**: `--dynamic-min-width`, `--viewport-width`, `--in-app-modifier` updated by ViewportManager
- **Smooth Grid Transitions**: `--grid-transition` for seamless layout changes
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

#### Viewport Management System
- **ViewportManager Class** (`src/utils/viewportManager.js`): Singleton service for dynamic viewport handling
- **Real-time Adaptation**: Updates CSS custom properties on window resize, orientation change, and visibility change
- **In-app Browser Detection**: Identifies LinkedIn, Instagram, Facebook, WeChat, Line, Twitter in-app browsers
- **Debounced Updates**: 100ms debouncing for resize events, 500ms delay for orientation changes
- **CSS Classes Added**: `.narrow-viewport`, `.very-narrow-viewport`, `.in-app-browser` for styling hooks
- **Grid Responsiveness**: `minmax(var(--dynamic-min-width, 280px), 1fr)` ensures mobile compatibility
- **Smooth Transitions**: 0.4s cubic-bezier transitions prevent jarring layout changes
- **Development Logging**: Console output in development mode for debugging

#### Performance Considerations
- Intersection Observer for efficient scroll animations
- Event-driven architecture for real-time updates
- **Viewport Manager**: Debounced resize handling with singleton pattern
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
- **Dynamic viewport properties**: `--dynamic-min-width`, `--viewport-width`, `--in-app-modifier` automatically managed
- **Component styles**: Edit individual CSS files in `src/styles/`
- **Grid layouts**: Projects.css and Info.css use `var(--dynamic-min-width)` for responsive grid columns
- **Responsive breakpoints**: Multiple breakpoints for various devices with dynamic adaptation

### Running Tests
```bash
cd portfolio-site
npm run test           # Watch mode for development
npm run test:run       # Single run for CI
npm run test:ui        # Visual test UI
npm run test:coverage  # Generate coverage report
```

### Viewport Management and Mobile Issues
The application includes a sophisticated viewport management system to handle sizing issues across different browsers and devices:

#### Common Issues and Solutions
- **In-app browser sizing**: ViewportManager automatically detects and adapts to LinkedIn, Instagram, Facebook in-app browsers
- **Initial load jumps**: Grid layouts use smooth transitions to prevent jarring size changes
- **Mobile overflow**: Dynamic `--dynamic-min-width` ensures content never exceeds viewport width
- **Grid responsiveness**: Uses `minmax(var(--dynamic-min-width, 280px), 1fr)` pattern for all grid layouts

#### Debugging Viewport Issues
- Enable development mode to see viewport change logs in browser console
- Check CSS custom properties: `--dynamic-min-width`, `--viewport-width`, `--in-app-modifier`
- Verify CSS classes: `.narrow-viewport`, `.very-narrow-viewport`, `.in-app-browser`
- ViewportManager instance available globally for manual testing: `viewportManager.forceUpdate()`

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
│   └── utils/                  # Utility functions
│       └── viewportManager.js  # Dynamic viewport management for in-app browsers
├── public/                     # Static assets
├── dist/                       # Build output (gitignored)
├── lambda-functions/           # AWS Lambda functions for backend
│   ├── recordSpin.js          # Analytics: Record wheel spins
│   ├── getSpinHistory.js      # Analytics: Retrieve spin history
│   ├── getGlobalMetrics.js    # Analytics: Global usage statistics
│   ├── clearSpinHistory.js    # Analytics: Clear history data
│   ├── portfolioCreateEntry.js # DataManager: Create entries
│   ├── portfolioDeleteEntry.js # DataManager: Delete entries
│   ├── portfolioGetEntries.js  # DataManager: Retrieve entries
│   ├── package.json            # Lambda dependencies (AWS SDK v3)
│   ├── deploy.sh              # Main deployment script
│   ├── quick-deploy.sh        # Fast deployment script
│   ├── verify-deployment.sh   # Post-deployment testing
│   ├── README.md              # Lambda functions overview
│   └── guides/                # Documentation
│       ├── DEPLOYMENT_GUIDE.md
│       ├── MANUAL_DEPLOYMENT_GUIDE.md
│       ├── AWS_TROUBLESHOOTING_GUIDE.md
│       └── README.md
└── .github/
    └── workflows/
        └── deploy.yml          # CI/CD pipeline
```

## Lambda Functions Deployment

### Available Lambda Functions
The backend consists of 8 Lambda functions deployed in the `eu-north-1` region:

**Entry Management System:**
- `portfolio-create-entry` - Creates new wheel entries
- `portfolio-delete-entry` - Removes wheel entries
- `portfolio-get-entries` - Retrieves all wheel entries

**Spin Analytics System:**
- `recordSpin` - Records wheel spin events
- `getSpinHistory` - Retrieves paginated spin history
- `getGlobalMetrics` - Calculates usage statistics and analytics
- `clearSpinHistory` - Clears all spin data (admin function)

### Deployment Commands

**Quick Deployment:**
```bash
cd lambda-functions
./deploy.sh deploy          # Deploy all functions automatically
./verify-deployment.sh      # Comprehensive testing suite
```

**Alternative Methods:**
```bash
./deploy.sh                 # Package only (manual upload)
./quick-deploy.sh           # Fast deployment for updates
```

### API Endpoints
All endpoints are available at: `https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod`

**Entry Management:**
- `GET /entries` - List all entries
- `POST /entries` - Create new entry
- `DELETE /entries/{id}` - Delete specific entry

**Spin Analytics:**
- `POST /spins` - Record a wheel spin
- `GET /spins?limit=N` - Get spin history
- `GET /metrics` - Get usage analytics
- `DELETE /spins` - Clear all spin data

### Troubleshooting
See `lambda-functions/guides/AWS_TROUBLESHOOTING_GUIDE.md` for:
- Common issues and solutions
- AWS CLI diagnostic commands
- API Gateway configuration fixes
- DynamoDB permission problems

### Lambda Functions Architecture & Deployment

**Function Structure:**
All Lambda functions are individual `.js` files with unified dependencies managed via a single `package.json`:
- **Dependencies**: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `uuid`
- **Runtime**: Node.js 20.x
- **Packaging**: Each function zipped individually with shared dependencies
- **Deployment**: Automated via `deploy.sh` with backup system

**Deployment Scripts:**
- `deploy.sh` - Main deployment script with packaging and AWS deployment
- `quick-deploy.sh` - Fast deployment for code updates only
- `verify-deployment.sh` - Comprehensive testing suite for all functions and endpoints
- `package-functions.sh` - Creates ZIP packages for manual deployment

**Backup System:**
- Automatic backups created before each deployment in `backups/YYYYMMDD_HHMMSS/`
- Backup URLs stored for rollback capability
- Each function versioned independently

### Critical Cross-Region Configuration Notes
The infrastructure uses a **cross-region setup** that requires specific configuration:

**Architecture:**
- **API Gateway**: `us-east-1` (required for CloudFront compatibility)
- **Lambda Functions**: `eu-north-1`
- **DynamoDB**: `eu-north-1`

**Lambda Permission Requirements:**
For cross-region API Gateway → Lambda integration to work, Lambda permissions must use the **Lambda function's region** (`eu-north-1`) in the source ARN, NOT the API Gateway region:

```bash
# CORRECT - Uses eu-north-1 (Lambda region)
arn:aws:execute-api:eu-north-1:ACCOUNT:API_ID/*/METHOD/path/*

# INCORRECT - Uses us-east-1 (API Gateway region)
arn:aws:execute-api:us-east-1:ACCOUNT:API_ID/*/METHOD/path/*
```

**API Gateway Integration Requirements:**
All methods must have both:
1. **Method Responses**: Defined response codes (200, etc.)
2. **Integration Responses**: Maps Lambda response to method response with CORS headers

Missing `integrationResponses` will cause "Internal server error" even if Lambda executes successfully.

**Path Parameter Configuration:**
Resource paths must use `{parameter}` syntax (not literal values):
- ✅ `/entries/{id}` - Creates path parameter
- ❌ `/entries/id` - Literal string, no parameter extraction

**Function Naming Convention:**
- Portfolio data functions: `portfolio-[action]-entry` (e.g., `portfolio-delete-entry`)
- Analytics functions: `[action][Entity]` (e.g., `recordSpin`, `getGlobalMetrics`)
- All functions deployable via unified scripts despite naming differences

## Important Implementation Notes
- **JavaScript with JSX** - No TypeScript
- **Comprehensive Testing** - Full test suite with Vitest and Testing Library
- **Live AWS Backend** - Production data persistence with DynamoDB
- **Cross-component Communication** - Custom event system for real-time updates
- **Dynamic Viewport Management** - Automatic adaptation for in-app browsers and mobile devices
- **Production-ready CI/CD** - Complete GitHub Actions deployment pipeline
- Router is imported but navigation uses scroll-to-section instead of routing
- Form handling in Contact component is placeholder (no backend integration)
- All project images are placeholder URLs that need to be replaced
- **ViewportManager**: Auto-initializes in main.jsx, no manual setup required