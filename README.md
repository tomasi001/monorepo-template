# direct-monorepo

A monorepo containing a frontend application, a backend application, and shared packages for UI, database, and configurations. Managed with Yarn and Turborepo.

## Prerequisites

- [Node.js](https://nodejs.org/) (Check `.nvmrc` for specific version)
- [Yarn v1](https://classic.yarnpkg.com/en/docs/install)
- [Docker](https://www.docker.com/get-started) (for running the PostgreSQL database)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd direct-monorepo
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Set up environment variables:**
    Each application (`apps/frontend`, `apps/backend`) and potentially packages might require environment variables. Copy any `.env.example` files to `.env` within the respective directories and fill in the required values.
    - Ensure the database connection details in `apps/backend/.env` match the `docker-compose.yml` settings or your external database configuration.

## Running Locally

1.  **Start the database service:**

    ```bash
    docker-compose up -d
    ```

    This command starts a PostgreSQL container based on the `docker-compose.yml` file.

2.  **Run database migrations:**
    Make sure the backend application has the correct database URL in its `.env` file.

    ```bash
    yarn db:migrate:dev
    ```

    This command likely targets the `backend` application via Turborepo to apply necessary database schema changes.

3.  **Start the development servers:**
    ```bash
    yarn dev
    ```
    This will start the `frontend` and `backend` applications in parallel development mode using Turborepo. Check the terminal output for the specific ports they are running on (e.g., frontend usually on `http://localhost:3000`, backend on `http://localhost:3001` or similar).

## Available Scripts

The following scripts can be run from the root of the monorepo:

- `yarn build`: Build all applications and packages.
- `yarn dev`: Start all applications in development mode.
- `yarn lint`: Lint all code in the monorepo.
- `yarn format`: Format all code using Prettier.
- `yarn clean`: Remove `node_modules` and build artifacts from all packages.
- `yarn generate`: Run code generation tasks (e.g., `prisma generate`).
- `yarn db:migrate:dev`: Apply database migrations (targets the relevant app/package).
- `yarn db:generate`: Generate database client (likely Prisma) based on the schema.
- `yarn db:studio`: Start Prisma Studio (runs from `packages/database`).

## Technology Stack

- **Monorepo:** Turborepo
- **Package Manager:** Yarn 1.x
- **Language:** TypeScript
- **Linting:** ESLint
- **Formatting:** Prettier
- **Database:** PostgreSQL (with Prisma likely used in `packages/database`)
- **Containerization:** Docker (for local DB)

_(Add more specific details about frontend/backend frameworks if known)_

## Contributing

_(Add contribution guidelines here if applicable)_

## License

MIT _(Based on `package.json`)_
