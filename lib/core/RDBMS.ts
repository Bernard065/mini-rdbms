import { SQLParser } from '@/lib/parser';
import {
  SelectExecutor,
  InsertExecutor,
  UpdateExecutor,
  DeleteExecutor,
  CreateTableExecutor,
  MetaExecutor,
  AlterTableExecutor,
  DropTableExecutor,
} from '@/lib/executor';
import { TableStorage } from '@/lib/storage';
import { SQLStatement, QueryResult, Database, ErrorResult } from '@/lib/types';

export class RDBMS {
  private tables: Map<string, TableStorage>;
  private inTransaction: boolean;
  private transactionTables: Map<string, TableStorage> | null;

  constructor() {
    this.tables = new Map();
    this.inTransaction = false;
    this.transactionTables = null;
  }

  // Executes a given SQL query
  execute(sql: string): QueryResult {
    const startTime = performance.now();

    try {
      const parser = new SQLParser(sql.trim());
      const statement = parser.parse();

      return this.executeStatement(statement);
    } catch (error) {
      if (this.isDatabaseError(error)) {
        return {
          success: false,
          type: 'ERROR',
          error,
          executionTime: performance.now() - startTime,
        };
      }

      let message = 'Unknown error';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const err = error as { message: unknown };
        if (typeof err.message === 'string') {
          message = err.message;
        }
      }

      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'SYNTAX_ERROR',
          message,
        },
        executionTime: performance.now() - startTime,
      };
    }
  }

  private executeStatement(statement: SQLStatement): QueryResult {
    const tables =
      this.inTransaction && this.transactionTables
        ? this.transactionTables
        : this.tables;
    switch (statement.type) {
      case 'SELECT':
        return SelectExecutor.execute(statement, tables);
      case 'INSERT':
        return InsertExecutor.execute(statement, tables);
      case 'UPDATE':
        return UpdateExecutor.execute(statement, tables);
      case 'DELETE':
        return DeleteExecutor.execute(statement, tables);
      case 'CREATE_TABLE':
        return CreateTableExecutor.execute(statement, tables);
      case 'ALTER_TABLE':
        return AlterTableExecutor.execute(statement, tables);
      case 'DROP_TABLE':
        return DropTableExecutor.execute(statement, tables);
      case 'SHOW_TABLES':
        return MetaExecutor.executeShowTables(statement, tables);
      case 'DESCRIBE':
        return MetaExecutor.executeDescribe(statement, tables);
      case 'BEGIN':
        return this.beginTransaction();
      case 'COMMIT':
        return this.commitTransaction();
      case 'ROLLBACK':
        return this.rollbackTransaction();
      default:
        return {
          success: false,
          type: 'ERROR',
          error: {
            type: 'EXECUTION_ERROR',
            message: 'Unknown statement type',
          },
          executionTime: 0,
        };
    }
  }

  // Transaction management methods
  beginTransaction(): QueryResult {
    if (this.inTransaction) {
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'TRANSACTION_ERROR',
          message: 'Transaction already in progress',
        },
        executionTime: 0,
      };
    }
    // Deep copy tables for transaction isolation
    this.transactionTables = new Map();
    for (const [name, storage] of this.tables) {
      this.transactionTables.set(name, storage.clone());
    }
    this.inTransaction = true;
    return { success: true, type: 'OK', executionTime: 0 };
  }

  commitTransaction(): QueryResult {
    if (!this.inTransaction || !this.transactionTables) {
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'TRANSACTION_ERROR',
          message: 'No transaction in progress',
        },
        executionTime: 0,
      };
    }
    this.tables = this.transactionTables;
    this.transactionTables = null;
    this.inTransaction = false;
    return { success: true, type: 'OK', executionTime: 0 };
  }

  rollbackTransaction(): QueryResult {
    if (!this.inTransaction) {
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'TRANSACTION_ERROR',
          message: 'No transaction in progress',
        },
        executionTime: 0,
      };
    }
    this.transactionTables = null;
    this.inTransaction = false;
    return { success: true, type: 'OK', executionTime: 0 };
  }

  // Gets all table names in the database
  getTableNames(): string[] {
    const tables =
      this.inTransaction && this.transactionTables
        ? this.transactionTables
        : this.tables;
    return Array.from(tables.keys()).sort();
  }

  getTable(name: string): TableStorage | null {
    const tables =
      this.inTransaction && this.transactionTables
        ? this.transactionTables
        : this.tables;
    return tables.get(name) ?? null;
  }

  hasTable(name: string): boolean {
    const tables =
      this.inTransaction && this.transactionTables
        ? this.transactionTables
        : this.tables;
    return tables.has(name);
  }

  getDatabase(): Database {
    const tables =
      this.inTransaction && this.transactionTables
        ? this.transactionTables
        : this.tables;
    const tableMap = new Map();
    for (const [name, storage] of tables) {
      tableMap.set(name, storage.toTable());
    }
    return {
      tables: tableMap,
    };
  }

  reset(): void {
    this.tables.clear();
    if (this.transactionTables) {
      this.transactionTables.clear();
    }
    this.inTransaction = false;
    this.transactionTables = null;
  }

  getStats(): {
    tableCount: number;
    totalRows: number;
    tables: Array<{ name: string; rowCount: number }>;
  } {
    const tables =
      this.inTransaction && this.transactionTables
        ? this.transactionTables
        : this.tables;
    let totalRows = 0;
    const tableStats = [];
    for (const [name, storage] of tables) {
      const rowCount = storage.getRowCount();
      totalRows += rowCount;
      tableStats.push({ name, rowCount });
    }
    return {
      tableCount: tables.size,
      totalRows,
      tables: tableStats.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  private isDatabaseError(error: unknown): error is ErrorResult['error'] {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      (error as { type: string }).type !== undefined
    );
  }
}
