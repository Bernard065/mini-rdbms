# Mini RDBMS Challenge Documentation

## Challenge Statement

**Design and implement a relational database management system (RDBMS):**

- Support for declaring tables with a few column data types
- CRUD operations
- Basic indexing and primary/unique keying
- Some joining
- The interface should be SQL or something similar, and it should have an interactive REPL mode

**Demonstrate the use of your RDBMS by writing a trivial web app that requires CRUD to the DB.**

---

## How the Challenge Was Achieved

### 1. RDBMS Implementation (with Persistent Backend)

- **Language:** TypeScript
- **Core Location:**
  - `lib/core/RDBMS.ts`: Main RDBMS logic, table management, SQL execution, transaction support
  - `lib/storage/Table.ts`: (Legacy) In-memory table storage, now replaced by persistent backend
  - `lib/parser/SQLParser.ts`: SQL parsing for DDL/DML/joins/transactions
  - `lib/types/`: Type definitions for SQL, database, and query results
  - `prisma/`, `app/api/`: Prisma schema and API routes for persistent storage
- **Features:**
  - Table declaration with data types: INTEGER, TEXT, BOOLEAN, REAL, DATE
  - SQL parsing and execution (CREATE TABLE, INSERT, SELECT, UPDATE, DELETE, etc.)
  - Indexing and enforcement of PRIMARY KEY and UNIQUE constraints
  - JOIN support in SELECT queries (INNER JOIN, etc.)
  - Transaction support (BEGIN, COMMIT, ROLLBACK)
  - **Persistent storage via Prisma and a real database backend**
  - Type-safe, modular design

### 2. SQL Interface & Interactive REPL

- **Component:** `components/repl/REPLTerminal.tsx`
- **Features:**
  - Interactive SQL editor in the browser
  - Query history and result display
  - Example queries for quick testing
  - Triggers data refresh in the demo app on mutating queries

### 3. Demo Web Application

- **Component:** `components/demo/DemoApp.tsx`
- **Features:**
  - Customer and Order management (CRUD)
  - Demonstrates JOIN queries (e.g., orders with customer info)
  - Uses the RDBMS via SQL interface and API
  - UI built with React, Tailwind CSS, and RTK Query

### 4. API & Database Layer

- **Location:** `app/api/`, `prisma/`
- **Features:**
  - RESTful endpoints for customers and orders
  - Executes SQL statements via the RDBMS core, which now interacts with a persistent database using Prisma
  - Used by the demo app for CRUD operations
  - Prisma migrations and schema for database structure

### 5. Modularity & Extensibility

- The codebase is organized for clarity and extensibility:
  - `lib/` for core logic, types, and executors
  - `components/` for UI and REPL
  - `app/` for Next.js routing and API

---

## Reviewer Notes

- The RDBMS is now backed by a persistent database (via Prisma), and is type-safe, implemented in TypeScript.
- The web app demonstrates all required features: table creation, CRUD, indexing, constraints, JOINs, and an interactive SQL REPL.
- The codebase is modular and documented for easy review.
- For any questions, see the code in the `lib/`, `components/`, and `app/` directories.
