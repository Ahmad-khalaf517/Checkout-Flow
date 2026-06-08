# Checkout Flow

A frontend-only multi-step checkout experience built with React, TypeScript, Vite, Zustand, React Hook Form, Zod, and shadcn/ui-style components.

The app walks through a checkout flow with personal information, billing and shipping address entry, payment details, order review, and success or error states. All behavior runs locally in the browser.

## Features

- Multi-step checkout flow with step navigation
- Inline form validation and error handling
- Local session persistence for in-progress checkout state
- Review screen with editable sections
- Success and error states with toast and animation feedback
- Responsive layout for desktop and mobile screens

## Requirements

- Node.js 18 or newer
- pnpm 9 or newer

## Install Dependencies

Install the project dependencies from the repository root:

```bash
pnpm install
```

## Run Locally

Start the development server:

```bash
pnpm dev
```

Then open the local URL shown in the terminal, usually `http://localhost:5173`.

## Available Scripts

- `pnpm dev` - start the Vite development server
- `pnpm build` - create a production build
- `pnpm preview` - preview the production build locally
- `pnpm lint` - run ESLint across the project
- `pnpm typecheck` - run the TypeScript compiler without emitting files
- `pnpm format` - format TypeScript files with Prettier

## Project Structure

- `src/components/checkout/` - checkout screens and flow components
- `src/components/ui/` - shared UI primitives
- `src/hooks/` - reusable hooks for checkout state
- `src/lib/` - validation and utility helpers
- `src/services/` - local service and adapter logic
- `src/stores/` - Zustand checkout store
- `specs/001-payment-checkout-flow/` - feature specification and implementation notes

## Notes

- The checkout flow is frontend-only and does not call external backend services.
- Validation, success, and error handling are all handled locally.
- Checkout progress is stored in browser session storage so users can resume within the same session.

## Contributing

If you add new checkout components or flows, keep the state updates and validation rules aligned with the local store and schema definitions in `src/`.
