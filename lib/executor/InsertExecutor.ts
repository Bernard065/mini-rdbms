import { InsertStatement, InsertResult, ErrorResult } from '@/lib/types';
import { TableStorage } from '@/lib/storage';

// Executor for INSERT statements
export class InsertExecutor {
  static execute(
    statement: InsertStatement,
    tables: Map<string, TableStorage>
  ): InsertResult | ErrorResult {
    const startTime = performance.now();

    try {
      const table = tables.get(statement.tableName);
      if (!table) {
        return {
          success: false,
          type: 'ERROR',
          error: {
            type: 'TABLE_NOT_FOUND',
            tableName: statement.tableName,
          },
          executionTime: performance.now() - startTime,
        };
      }

      const schema = table.getSchema();

      let columnNames: string[];
      if (statement.columns) {
        columnNames = Array.from(statement.columns);

        for (const colName of columnNames) {
          const exists = schema.columns.some((col) => col.name === colName);
          if (!exists) {
            return {
              success: false,
              type: 'ERROR',
              error: {
                type: 'COLUMN_NOT_FOUND',
                columnName: colName,
              },
              executionTime: performance.now() - startTime,
            };
          }
        }
      } else {
        columnNames = schema.columns.map((col) => col.name);
      }

      let rowsAffected = 0;
      let lastInsertId: number | null = null;

      for (const valueRow of statement.values) {
        if (valueRow.length !== columnNames.length) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'EXECUTION_ERROR',
              message: `Column count (${columnNames.length}) doesn't match value count (${valueRow.length})`,
            },
            executionTime: performance.now() - startTime,
          };
        }

        const rowData: Record<string, unknown> = {};
        for (let i = 0; i < columnNames.length; i++) {
          const colName = columnNames[i];
          const value = valueRow[i];
          if (colName && value !== undefined) {
            rowData[colName] = value;
          }
        }

        const insertResult = table.insertRow(rowData);

        if (!insertResult.success) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'CONSTRAINT_VIOLATION',
              violation: insertResult.error!,
            },
            executionTime: performance.now() - startTime,
          };
        }

        rowsAffected++;
        if (insertResult.lastInsertId !== undefined) {
          lastInsertId = insertResult.lastInsertId;
        }
      }

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        type: 'INSERT',
        rowsAffected,
        lastInsertId,
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
