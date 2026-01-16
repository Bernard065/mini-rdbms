import {
  CreateTableStatement,
  CreateTableResult,
  ErrorResult,
  TableSchema,
  ColumnDefinition,
} from '@/lib/types';
import { TableStorage } from '@/lib/storage';

// Executor for CREATE TABLE statements
export class CreateTableExecutor {
  static execute(
    statement: CreateTableStatement,
    tables: Map<string, TableStorage>
  ): CreateTableResult | ErrorResult {
    const startTime = performance.now();

    try {
      if (tables.has(statement.tableName)) {
        if (statement.ifNotExists) {
          // Table exists and IF NOT EXISTS was specified, return success
          return {
            success: true,
            type: 'CREATE_TABLE',
            tableName: statement.tableName,
            executionTime: performance.now() - startTime,
          };
        }
        return {
          success: false,
          type: 'ERROR',
          error: {
            type: 'TABLE_ALREADY_EXISTS',
            tableName: statement.tableName,
          },
          executionTime: performance.now() - startTime,
        };
      }

      const columns: ColumnDefinition[] = [];
      let primaryKey: string | null = null;
      const uniqueColumns: string[] = [];

      for (const col of statement.columns) {
        const isPrimaryKey = col.constraints.includes('PRIMARY KEY');
        const isUnique = col.constraints.includes('UNIQUE');
        const isNotNull = col.constraints.includes('NOT NULL');
        const isAutoIncrement = col.constraints.includes('AUTO_INCREMENT');

        if (isAutoIncrement && !isPrimaryKey) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'SYNTAX_ERROR',
              message: 'AUTO_INCREMENT can only be used with PRIMARY KEY',
            },
            executionTime: performance.now() - startTime,
          };
        }

        if (isPrimaryKey) {
          if (primaryKey !== null) {
            return {
              success: false,
              type: 'ERROR',
              error: {
                type: 'SYNTAX_ERROR',
                message: 'Multiple primary keys defined',
              },
              executionTime: performance.now() - startTime,
            };
          }
          primaryKey = col.name;
        }

        if (isUnique || isPrimaryKey) {
          uniqueColumns.push(col.name);
        }

        columns.push({
          name: col.name,
          type: col.dataType,
          primaryKey: isPrimaryKey,
          autoIncrement: isAutoIncrement,
          unique: isUnique || isPrimaryKey,
          notNull: isNotNull || isPrimaryKey,
          defaultValue: null,
        });
      }

      const schema: TableSchema = {
        name: statement.tableName,
        columns,
        primaryKey,
        uniqueColumns,
      };

      const table = new TableStorage(schema);
      tables.set(statement.tableName, table);

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        type: 'CREATE_TABLE',
        tableName: statement.tableName,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executionTime: performance.now() - startTime,
      };
    }
  }
}
