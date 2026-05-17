# Architecture Decisions

## ADR 001: Supabase Integration
- **Decision**: Use Supabase as the primary Backend-as-a-Service (BaaS).
- **Rationale**: Provides Auth, Real-time DB, and Storage out of the box with minimal configuration.
- **Trade-offs**: Vendor lock-in to Supabase ecosystems, but significantly reduces development time.
- **Status**: Accepted

## ADR 002: Vite for Frontend
- **Decision**: Use Vite for the frontend build tool.
- **Rationale**: Faster dev cycles and modern ESM support.
- **Status**: Accepted

## ADR 003: Express Backend API
- **Decision**: Use an Express.js backend architecture to handle API routes, rather than Next.js serverless functions.
- **Rationale**: The project was already built around a Vite + React + Express monolith for easier local execution. Maintaining this structure prevents major rewrites while still allowing scale via standard Node.js server deployment (e.g. Railway).
- **Status**: Accepted
