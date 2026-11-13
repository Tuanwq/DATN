# Feature Development Workflow

This document describes how we work together to build the personal finance management system. We develop it as a real software product, with the goal of delivering usable features and understanding how the system works and why each design decision was made.

## Product Goals and Platform Priorities

Android is the primary platform and the first priority for mobile development. It is intended to support the full set of features. The desktop experience focuses on reviewing data on a larger screen and making basic edits.

### Desktop (PC)

- Receive and display data from the system.
- View aggregated statistics and summaries on a large screen.
- Create, view, update, and delete basic records (CRUD).
- Leave room to add advanced features later as needed.

### Android

- Support the full range of personal finance workflows, including the features available on desktop.
- Capture photos to record transactions.
- Connect with banking apps and automatically record transactions from their notifications.
- Open the user's banking app to make a transfer.
- Send notifications and provide home screen widgets.

## Technology Stack

The planned Universal App shares a frontend codebase across Web and Android and uses a machine learning service for expense forecasting.

| Responsibility | Technologies and purpose |
| --- | --- |
| Frontend | React Native provides shared UI components, Expo provides development and build tooling, TypeScript adds static typing, and React Native Web renders shared components in the browser. |
| UI styling | NativeWind applies Tailwind CSS utilities to keep styling consistent across platforms. |
| Navigation | Expo Router defines routes and navigation across Web and Android. |
| Client state | Zustand manages client-side state shared across screens. |
| Server state | TanStack Query fetches and caches server data and manages mutations. |
| Backend and API | Node.js runs the TypeScript backend, and Express.js exposes a RESTful API that exchanges JSON over HTTPS. |
| Database | PostgreSQL stores relational financial data, and Prisma ORM provides type-safe database access. |
| Machine learning | Python runs the forecasting pipeline, pandas prepares transaction data, NumPy handles numerical operations, and scikit-learn trains and evaluates forecasting models. |
| ML service | FastAPI exposes expense forecasts to the backend. |
| Local storage | Expo SQLite stores offline data on Android, and IndexedDB stores it on the web. |
| Data synchronization | An offline-first architecture queues local changes, retries pending operations, prevents duplicates, and handles conflicts. |
| Deployment | Docker packages services as containers, and Docker Compose runs them together. |
| Version control and repository structure | Git tracks changes, GitHub hosts the repository, and a monorepo organizes the app, services, and shared code. |

## Project Structure

The planned monorepo keeps the personal finance client, backend, machine learning service, and shared code in one Git repository.

```text
DATN/
├── apps/
│   ├── client/                 # Expo app for Android and web
│   │   ├── src/
│   │   │   ├── app/            # Expo Router routes and layouts
│   │   │   ├── components/     # Reusable components
│   │   │   ├── screens/        # Application screens
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── services/       # API client and frontend services
│   │   │   ├── lib/            # Utilities
│   │   │   ├── types/          # Client-specific types
│   │   │   ├── theme/          # Theme configuration
│   │   │   └── ui/             # UI primitives
│   │   ├── public/
│   │   ├── app.json
│   │   └── package.json
│   └── api/                    # Node.js, Express, and TypeScript backend
├── services/
│   └── ml-api/                 # Python and FastAPI forecasting service
├── packages/
│   └── shared/                 # Shared TypeScript types, schemas, and utilities
├── docs/                       # Project documentation
├── .github/                    # CI/CD configuration
├── package.json                # Root workspace configuration
├── pnpm-workspace.yaml
└── README.md
```

### Responsibilities

- The client shares a React Native and Expo codebase across Android and web. It accesses server data through the backend API.
- The backend handles authentication and business logic, and accesses PostgreSQL through Prisma.
- The ML service processes financial data and forecasts spending.
- The client and backend use `packages/shared` for common TypeScript code. The client has no dependency on backend internals.

### Development Guidelines

- Keep UI, business logic, and data access in separate modules. Place new code in the directory that matches its responsibility and reuse components and utilities where appropriate.
- Preserve existing functionality and reuse existing code when restructuring the repository.
- Use pnpm Workspaces for JavaScript and TypeScript packages. Manage Python dependencies within `services/ml-api`.
- Keep each application and service independently developable, runnable, and deployable.

## Feature Development Process

1. **Analyze the business requirements**
   - Identify the problem to solve and who will use the feature.
   - Describe the main workflow and how to handle exceptions.
   - Agree on the business requirements before moving on to design.

2. **Design the database and API**
   - Identify the relevant database tables and their relationships.
   - Describe the endpoint, HTTP method, request, and response for each API operation.
   - Explain the reasons behind the database and API design choices.

3. **Write the requirements for Codex**
   - Describe the task and implementation scope.
   - Identify the files to work on.
   - Specify the business rules, technical constraints, and acceptance criteria.
   - Agree on the requirements before assigning the implementation to Codex.

4. **Have Codex implement the feature**
   - Codex writes the code according to the agreed requirements and stays within the assigned scope.
   - If implementation calls for a change to the business requirements, a major architectural decision, or an expansion of scope, Codex explains the issue and the reasoning for discussion before making the change.

5. **Run and test the feature**
   - Run the feature and check the results against the acceptance criteria.
   - Check the user interface, API, and database records affected by the feature.
   - Test both the main workflow and the identified exceptions.

6. **Review the code and fix issues**
   - The project owner shares the code, test results, or error details for joint analysis.
   - Codex fixes the identified issues, and the feature is tested again after the fixes.

7. **Explain the implementation**
   - The assistant explains the important parts, including how the code works, why it was implemented that way, and what other design options were available.
   - The project owner can ask about anything that remains unclear before signing off.

8. **Confirm completion**
   - The project owner signs off once the feature works reliably, meets the acceptance criteria, and they understand how it was implemented.
   - Move on to the next feature after sign-off.

## Working Principles

1. **Follow the agreed sequence.** Agree on the business requirements before designing the database and API.
2. **Understand the purpose before writing code.** Every code change serves a clear purpose.
3. **Give Codex specific tasks.** Define the scope and acceptance criteria for each request.
4. **Test against the business requirements.** Compare actual behavior and data with the expected results, even when the code runs successfully.
5. **Understand how the system works.** Take time to explain how the system works and why the implementation was chosen.
6. **Complete one feature at a time.** Focus on one feature until the project owner signs off.
7. **Discuss major decisions before applying them.** The assistant and Codex explain the reasons for and impact of major architectural decisions or business requirement changes, then agree on them with the project owner before applying them.

## Roles and Responsibilities

| Role | Responsibilities |
| --- | --- |
| Project owner (you) | Decide on the requirements, run the feature, verify the results, and sign off. |
| Project assistant | Help analyze business requirements, design the system, provide technical guidance, write requirements for Codex, review code, and explain the implementation. |
| Codex | Implement features and fix issues according to the agreed requirements. |

## Code Naming Conventions

- **Naming styles.** Use `camelCase` for JS/TS variables, functions, and properties. Use `PascalCase` for classes, types, interfaces, and React components. Use `snake_case` for Python variables and functions and for PostgreSQL tables and columns. Use `UPPER_SNAKE_CASE` for configuration constants. Use `kebab-case` for URLs and for file or directory names where required by project conventions.
- **Variables and functions.** Name variables with nouns that describe the data. Use `is`, `has`, and `can` for booleans, `total` for totals, and `selected` or `current` for selected or current values. Include the unit where it could be ambiguous, as in `amountVnd` and `syncTimeoutMs`. Start function names with verbs that describe the action, as in `calculateBalance`.
- **React, API, and Prisma.** Prefix custom hooks with `use`, event handlers with `handle`, and callback props with `on`. Use plural nouns for REST endpoints, as in `/api/transactions`. Prisma can use `@map` and `@@map` to map names in code to `snake_case` names in PostgreSQL.
- **Domain terminology.** Use one consistent name for each concept, such as `transaction`, `income`, `expense`, `balance`, `account`, `budget`, `category`, `expenseForecast`, and `pendingTransaction`.
- **Offline-first synchronization.** `isSavedLocally` indicates that a transaction has been durably stored on the device. `isSynced` indicates that the server has acknowledged synchronization. Use `syncStatus` for the states `pending`, `syncing`, `synced`, and `failed`. Use unique identifiers, safe retries, and a conflict resolution strategy to prevent lost or duplicate transactions.
