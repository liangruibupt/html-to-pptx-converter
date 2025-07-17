# HTML to PPTX Converter

A client-side web application that transforms HTML content into PowerPoint presentations (PPTX format). Users can upload HTML files or directly input HTML content, configure conversion settings, and download the resulting PPTX file.

## Features

- HTML file upload and direct HTML input
- Configurable conversion settings (slide layout, themes, section splitting)
- Preservation of text formatting, images, tables, lists, and hyperlinks
- Preview of HTML content before conversion
- Download of generated PPTX files

## Technology Stack

- **Frontend Framework**: React
- **Language**: TypeScript
- **Core Library**: PptxGenJS for PPTX generation
- **Build Tool**: Vite

## Project Structure

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
│   ├── hooks/              # Custom React hooks
│   ├── store/              # State management
│   ├── assets/             # Static assets
│   └── styles/             # Global styles
├── public/                 # Public assets
└── tests/                  # Test files
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── e2e/                # End-to-end tests
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/html-to-pptx-converter.git
cd html-to-pptx-converter

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at http://localhost:3000.

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Open Cypress test runner
npm run test:e2e:open
```

### Code Quality

```bash
# Run linter
npm run lint

# Run type checking
npm run type-check
```

## Key Dependencies

- **PptxGenJS**: Core library for generating PPTX files
- **React**: UI framework
- **TypeScript**: For type safety
- **Vite**: Build tool
- **Vitest**: Testing framework
- **Cypress**: End-to-end testing

## User Experience Goals

- Intuitive and responsive interface
- Clear visual feedback during the conversion process
- Helpful error messages and guidance
- Support for different screen sizes and devices

## License

[MIT](LICENSE)