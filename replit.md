# Rentiverse - Rental Management System

## Overview

Rentiverse is a comprehensive rental management web application designed to streamline the entire rental process from product browsing to final return. Built with modern web technologies, it provides a unified platform for businesses to manage products, schedule pickups, handle online bookings, and process payments through a customer portal.

The system supports multiple user roles (customers and administrators) with dedicated dashboards for each, comprehensive product catalog management, order tracking through various rental states, automated notifications, and flexible pricing models including time-dependent rates.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 2025**: Fixed MongoDB connection issues by converting to PostgreSQL
- Migrated from MongoDB/Mongoose to PostgreSQL with Drizzle ORM
- Updated all schema definitions to use Drizzle table structures
- Implemented proper PostgreSQL session store for authentication
- Created comprehensive environment setup documentation
- Application now works correctly with both local and cloud PostgreSQL databases

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing with protected routes for authenticated users
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **UI Framework**: Radix UI components with shadcn/ui for consistent, accessible design system
- **Styling**: Tailwind CSS with custom design tokens and responsive design patterns
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Framework**: Express.js with TypeScript for robust API development
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Password Security**: Node.js crypto module with scrypt for secure password hashing
- **Session Management**: Express sessions with PostgreSQL session store for scalable session persistence
- **API Design**: RESTful endpoints with consistent error handling and request/response patterns

### Data Layer
- **Database**: PostgreSQL with Neon serverless hosting for scalable cloud database
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **Database Design**: Relational model supporting users, products, categories, orders, payments, and notifications

### Authentication & Authorization
- **Strategy**: Session-based authentication with role-based access control (RBAC)
- **User Roles**: Customer and Admin roles with different permission levels
- **Protected Routes**: Frontend route guards based on authentication status and user roles
- **Session Storage**: PostgreSQL-backed session store for production scalability

### Development Architecture
- **Build System**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement with custom middleware for API proxy
- **TypeScript**: Full-stack TypeScript with shared type definitions and path mapping
- **Code Organization**: Monorepo structure with shared schemas and utilities

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection with edge compatibility
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect for database operations
- **@tanstack/react-query**: Server state management with caching and synchronization
- **passport**: Authentication middleware with local strategy implementation

### UI & Design System
- **@radix-ui/***: Comprehensive set of low-level UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework with custom design tokens
- **class-variance-authority**: Type-safe component variants for consistent styling
- **lucide-react**: Modern icon library with React components

### Form & Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Integration with Zod for schema-based validation
- **zod**: Runtime type validation and schema definition

### Payment Processing
- **@stripe/stripe-js**: Stripe JavaScript SDK for payment processing
- **@stripe/react-stripe-js**: React components for Stripe Elements integration

### Security & Encryption
- **bcrypt**: Password hashing library for secure user authentication
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Development Tools
- **vite**: Next-generation build tool with fast HMR and optimized builds
- **tsx**: TypeScript execution environment for development server
- **esbuild**: Fast JavaScript bundler for production builds