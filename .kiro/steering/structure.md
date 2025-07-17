---
inclusion: always
---

# Project Structure

## Directory Organization

```
/
├── src/                    # Source code
│   ├── components/         # UI components
│   │   ├── upload/         # File upload components
│   │   ├── config/         # Configuration components
│   │   ├── preview/        # HTML preview components
│   │   └── download/       # Download components
│   ├── services/           # Core services
│   │   ├── parser/         # HTML parsing services
│   │   ├── conversion/     # Conversion engine
│   │   ├── pptx/           # PptxGenJS integration
│   │   └── download/       # Download management
│   ├── models/             # TypeScript interfaces and types
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks (if using React)
│   ├── store/              # State management
│   ├── assets/             # Static assets
│   └── styles/             # Global styles
├── public/                 # Public assets
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
└── .kiro/                  # Kiro configuration
    ├── specs/              # Project specifications
    └── steering/           # Steering rules
```

## Architecture Patterns

### Component Structure
- Components follow a modular design pattern
- Each component has its own directory with:
  - Main component file
  - Associated styles
  - Unit tests
  - Index file for exports

### Service Layer
- Services are organized by functionality
- Each service has a clear interface defined in TypeScript
- Services are designed to be testable in isolation

### State Management
- Application state follows a centralized pattern
- State updates are handled through actions/reducers
- Components access state through hooks or connectors

### Code Organization Principles
- Single Responsibility Principle for components and services
- Clear separation between UI and business logic
- TypeScript interfaces defined for all data structures
- Consistent error handling throughout the application