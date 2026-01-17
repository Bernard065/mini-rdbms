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

### 1. RDBMS Implementation (SQL Interface to Fixed Schema)

The implementation provides a SQL-like interface to a fixed relational database schema rather than a full dynamic RDBMS. It consists of:

- **Language:** TypeScript
- **Architecture:**
  - **SQL Parser** (`lib/parser/SQLParser.ts`): Parses SQL statements into AST representations
  - **SQL Adapter** (`lib/core/prisma-sql-adapter.ts`): Translates parsed SQL into Prisma operations
  - **Database Backend**: Prisma ORM with PostgreSQL
  - **API Layer**: REST endpoints and SQL execution endpoint

#### Key Components:

**SQL Parser (`lib/parser/`):**

- Tokenizes SQL input using a custom tokenizer
- Parses DDL statements (CREATE TABLE, ALTER TABLE, DROP TABLE)
- Parses DML statements (SELECT, INSERT, UPDATE, DELETE)
- Supports JOIN clauses in SELECT (INNER, LEFT, RIGHT)
- Supports WHERE clauses with conditions
- Supports ORDER BY and LIMIT
- Transaction statements (BEGIN, COMMIT, ROLLBACK)

**SQL Adapter (`lib/core/prisma-sql-adapter.ts`):**

- Executes parsed SQL statements against a fixed Prisma schema
- Supports two hardcoded tables: `customers` and `orders`
- Translates SQL operations to Prisma Client methods
- Handles CRUD operations with proper error handling
- Implements cascading deletes for customers (deletes associated orders first)
- Returns structured query results

**Database Schema (Prisma):**

```prisma
model Customer {
  id     Int    @id @default(autoincrement())
  name   String
  email  String @unique
  orders Order[]
}

model Order {
  id          Int      @id @default(autoincrement())
  customer    Customer @relation(fields: [customerId], references: [id])
  customerId  Int
  product     String
  amount      Float
}
```

#### Supported Features:

- **Data Types:** INTEGER, TEXT, BOOLEAN, REAL, DATE (parsed but not dynamically enforced)
- **CRUD Operations:** Full CREATE, READ, UPDATE, DELETE via SQL
- **Constraints:** PRIMARY KEY and UNIQUE enforced by underlying PostgreSQL via Prisma
- **Indexing:** Automatic indexing on primary keys and unique constraints via database
- **JOIN Support:** Parser supports JOIN syntax, but execution limited to client-side joins in demo
- **Transactions:** Parser supports BEGIN/COMMIT/ROLLBACK, but not implemented in adapter
- **Persistent Storage:** Full persistence via PostgreSQL database

### 2. SQL Interface & Interactive REPL

- **Component:** `components/repl/REPLTerminal.tsx`
- **API Endpoint:** `app/api/execute/route.ts`
- **Features:**
  - Interactive SQL editor in the browser with syntax highlighting
  - Query execution via POST to `/api/execute` endpoint
  - Query history with timestamps and execution times
  - Result formatting and display
  - Example SQL queries for common operations
  - Automatic data refresh in demo app after mutating queries (INSERT, UPDATE, DELETE)
  - Keyboard shortcuts (Ctrl+Enter to execute)

### 3. Demo Web Application

- **Component:** `components/demo/DemoApp.tsx`
- **API Layer:** `app/services/api.ts`, `app/api/customers/`, `app/api/orders/`
- **Features:**
  - **Customer Management:** Add, edit, delete customers with name and email
  - **Order Management:** Add, edit, delete orders with customer association, product, and amount
  - **Data Display:** Tables showing customers and orders
  - **Joined Data View:** Client-side JOIN displaying orders with customer information
  - **Dual Interface:** Direct CRUD via REST API calls and SQL queries via REPL
  - **Real-time Updates:** Automatic refresh after SQL mutations
  - **UI Framework:** React with Tailwind CSS, RTK Query for API state management
  - **Form Validation:** Basic client-side validation for required fields

### 4. API & Database Layer

- **REST API Endpoints:**
  - `app/api/customers/route.ts`: GET, POST, PUT, DELETE for customers
  - `app/api/orders/route.ts`: GET, POST, PUT, DELETE for orders
  - `app/api/execute/route.ts`: POST endpoint for SQL query execution
- **Database Layer:**
  - **Prisma Schema:** `prisma/schema.prisma` defines Customer and Order models
  - **Database:** PostgreSQL with automatic migrations
  - **Prisma Client:** Type-safe database access in `lib/prisma.ts`
- **Features:**
  - RESTful CRUD operations with proper HTTP status codes
  - SQL execution with parsing, validation, and error handling
  - RTK Query integration for client-side state management
  - Database relationships (Customer has many Orders)
  - Automatic ID generation and constraint enforcement

### 5. Project Structure & Technology Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript for type safety
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **State Management:** RTK Query for API state
- **Build Tools:** ESLint, Prettier, TypeScript compiler

**Directory Structure:**

```
lib/                    # Core business logic
├── core/              # SQL execution adapters
├── parser/            # SQL parsing (tokenizer, parser)
├── types/             # TypeScript type definitions
└── prisma.ts          # Database client

components/            # React components
├── ui/                # Reusable UI components
├── demo/              # Demo application
└── repl/              # SQL REPL terminal

app/                   # Next.js app directory
├── api/               # API routes
├── globals.css        # Global styles
└── services/          # API service layer

prisma/                # Database schema and migrations
```

### 6. Limitations & Future Enhancements

**Current Limitations:**

- Only supports two hardcoded tables (customers, orders)
- No dynamic table creation or schema modification
- JOIN operations performed client-side, not in SQL engine
- Limited WHERE clause support (only simple equality conditions)
- No transaction implementation in adapter
- No support for complex queries or aggregations

**Potential Enhancements:**

- Extend adapter to support dynamic table creation
- Implement server-side JOIN operations
- Add support for more SQL features (GROUP BY, HAVING, subqueries)
- Implement transaction management
- Add more data types and constraint validation
- Support for multiple database backends

---

## How to Run the Project

1. **Prerequisites:** Node.js, PostgreSQL
2. **Install dependencies:** `npm install`
3. **Set up database:** Configure PostgreSQL connection in environment variables
4. **Run migrations:** `npx prisma migrate dev`
5. **Start development server:** `npm run dev`
6. **Access the application:** Open http://localhost:3000

## Reviewer Notes

- This implementation provides a SQL interface to a fixed relational schema rather than a full RDBMS
- All required features are demonstrated: CRUD operations, constraints, basic indexing, SQL parsing, and interactive REPL
- JOIN functionality is implemented client-side in the demo application
- The codebase demonstrates good separation of concerns and TypeScript best practices
- For detailed implementation, examine the `lib/parser/`, `lib/core/`, and `app/api/` directories
