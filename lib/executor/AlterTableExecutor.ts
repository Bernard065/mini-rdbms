import { AlterTableStatement } from '@/lib/types';
import { TableStorage } from '@/lib/storage';
import { QueryResult } from '@/lib/types';

export class AlterTableExecutor {
  static execute(
    statement: AlterTableStatement,
    tables: Map<string, TableStorage>
  ): QueryResult {
    const { tableName, action } = statement;
    const table = tables.get(tableName);
    const startTime = performance.now();
    if (!table) {
      return {
        success: false,
        type: 'ERROR',
        error: { type: 'TABLE_NOT_FOUND', tableName },
        executionTime: performance.now() - startTime,
      };
    }

    const schema = {
      ...table.getSchema(),
      columns: [...table.getSchema().columns],
    };
    let rows = [...table.getRows()];

    switch (action.kind) {
      case 'ADD_COLUMN': {
        const { name, dataType, constraints } = action.column;
        if (schema.columns.some((col) => col.name === name)) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'COLUMN_NOT_FOUND',
              columnName: name,
              message: `Column '${name}' already exists`,
            },
            executionTime: performance.now() - startTime,
          };
        }
        const newCol = {
          name,
          type: dataType,
          primaryKey: constraints.includes('PRIMARY KEY'),
          autoIncrement: constraints.includes('AUTO_INCREMENT'),
          unique: constraints.includes('UNIQUE'),
          notNull: constraints.includes('NOT NULL'),
          defaultValue: null,
        };
        schema.columns.push(newCol);
        rows = rows.map((row) => ({ ...row, [name]: null }));
        table.updateSchemaAndRows(schema, rows);
        return {
          success: true,
          type: 'UPDATE',
          rowsAffected: 0,
          executionTime: performance.now() - startTime,
        };
      }
      case 'DROP_COLUMN': {
        const { columnName } = action;
        const colIdx = schema.columns.findIndex(
          (col) => col.name === columnName
        );
        if (colIdx === -1) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'COLUMN_NOT_FOUND',
              columnName,
              message: `Column '${columnName}' does not exist`,
            },
            executionTime: performance.now() - startTime,
          };
        }
        schema.columns.splice(colIdx, 1);
        rows = rows.map((row) => {
          const newRow = { ...row };
          delete newRow[columnName];
          return newRow;
        });
        table.updateSchemaAndRows(schema, rows);
        return {
          success: true,
          type: 'UPDATE',
          rowsAffected: 0,
          executionTime: performance.now() - startTime,
        };
      }
      case 'RENAME_COLUMN': {
        const { oldName, newName } = action;
        const colIdx = schema.columns.findIndex((col) => col.name === oldName);
        if (colIdx === -1) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'COLUMN_NOT_FOUND',
              columnName: oldName,
              message: `Column '${oldName}' does not exist`,
            },
            executionTime: performance.now() - startTime,
          };
        }
        if (schema.columns.some((col) => col.name === newName)) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'COLUMN_NOT_FOUND',
              columnName: newName,
              message: `Column '${newName}' already exists`,
            },
            executionTime: performance.now() - startTime,
          };
        }
        schema.columns[colIdx] = { ...schema.columns[colIdx]!, name: newName };
        rows = rows.map((row) => {
          const newRow = { ...row };
          newRow[newName] = newRow[oldName]!;
          delete newRow[oldName];
          return newRow;
        });
        table.updateSchemaAndRows(schema, rows);
        return {
          success: true,
          type: 'UPDATE',
          rowsAffected: 0,
          executionTime: performance.now() - startTime,
        };
      }
      case 'MODIFY_COLUMN': {
        const { name, dataType, constraints } = action.column;
        const colIdx = schema.columns.findIndex((col) => col.name === name);
        if (colIdx === -1) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'COLUMN_NOT_FOUND',
              columnName: name,
              message: `Column '${name}' does not exist`,
            },
            executionTime: performance.now() - startTime,
          };
        }
        schema.columns[colIdx] = {
          name,
          type: dataType,
          primaryKey: constraints.includes('PRIMARY KEY'),
          autoIncrement: constraints.includes('AUTO_INCREMENT'),
          unique: constraints.includes('UNIQUE'),
          notNull: constraints.includes('NOT NULL'),
          defaultValue: null,
        };
        table.updateSchemaAndRows(schema, rows);
        return {
          success: true,
          type: 'UPDATE',
          rowsAffected: 0,
          executionTime: performance.now() - startTime,
        };
      }
      default:
        return {
          success: false,
          type: 'ERROR',
          error: {
            type: 'EXECUTION_ERROR',
            message: 'ALTER TABLE action not implemented',
          },
          executionTime: performance.now() - startTime,
        };
    }
  }
}
