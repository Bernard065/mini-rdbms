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

  constructor() {
    this.tables = new Map();
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

      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'SYNTAX_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executionTime: performance.now() - startTime,
      };
    }
  }

  // Routes the SQL statement to the appropriate executor
  private executeStatement(statement: SQLStatement): QueryResult {
    switch (statement.type) {
      case 'SELECT':
        return SelectExecutor.execute(statement, this.tables);

      case 'INSERT':
        return InsertExecutor.execute(statement, this.tables);

      case 'UPDATE':
        return UpdateExecutor.execute(statement, this.tables);

      case 'DELETE':
        return DeleteExecutor.execute(statement, this.tables);

      case 'CREATE_TABLE':
        return CreateTableExecutor.execute(statement, this.tables);

      case 'ALTER_TABLE':
        return AlterTableExecutor.execute(statement, this.tables);

      case 'DROP_TABLE':
        return DropTableExecutor.execute(statement, this.tables);

      case 'SHOW_TABLES':
        return MetaExecutor.executeShowTables(statement, this.tables);

      case 'DESCRIBE':
        return MetaExecutor.executeDescribe(statement, this.tables);

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

  // Gets all table names in the database
  getTableNames(): string[] {
    return Array.from(this.tables.keys()).sort();
  }

  // Gets a specific table storage
  getTable(name: string): TableStorage | null {
    return this.tables.get(name) ?? null;
  }

  // Checks if a table exists
  hasTable(name: string): boolean {
    return this.tables.has(name);
  }

  // Gets the entire database structure
  getDatabase(): Database {
    const tableMap = new Map();
    for (const [name, storage] of this.tables) {
      tableMap.set(name, storage.toTable());
    }

    return {
      tables: tableMap,
    };
  }

  reset(): void {
    this.tables.clear();
  }

  // Gets database statistics
  getStats(): {
    tableCount: number;
    totalRows: number;
    tables: Array<{ name: string; rowCount: number }>;
  } {
    let totalRows = 0;
    const tables = [];

    for (const [name, storage] of this.tables) {
      const rowCount = storage.getRowCount();
      totalRows += rowCount;
      tables.push({ name, rowCount });
    }

    return {
      tableCount: this.tables.size,
      totalRows,
      tables: tables.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  // Type guard for database errors
  private isDatabaseError(error: unknown): error is ErrorResult['error'] {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      (error as { type: string }).type !== undefined
    );
  }
}
