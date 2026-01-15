import {
  Table,
  TableSchema,
  Row,
  ColumnValue,
  ConstraintViolation,
  Index,
} from '@/lib/types';
import { TypeValidator } from './TypeValidator';
import { IndexManager } from './IndexManager';

export class TableStorage {
  private schema: TableSchema;
  private rows: Row[];
  private indices: Map<string, Index>;
  private autoIncrementCounter: number;

  constructor(schema: TableSchema) {
    this.schema = schema;
    this.rows = [];
    this.indices = new Map();
    this.autoIncrementCounter = 1;

    // Create indices for primary key and unique columns
    this.initializeIndices();
  }

  getSchema(): TableSchema {
    return this.schema;
  }

  getRows(): readonly Row[] {
    return this.rows;
  }

  getRow(index: number): Row | null {
    return this.rows[index] ?? null;
  }

  getRowCount(): number {
    return this.rows.length;
  }

  insertRow(data: Record<string, unknown>): {
    success: boolean;
    rowIndex?: number;
    lastInsertId?: number;
    error?: ConstraintViolation;
  } {
    // Validate and prepare row data
    const preparedRow: Row = {};
    let lastInsertId: number | null = null;

    for (const column of this.schema.columns) {
      let value = data[column.name];

      // Handle auto-increment
      if (column.autoIncrement && column.primaryKey) {
        value = this.autoIncrementCounter;
        lastInsertId = this.autoIncrementCounter;
        this.autoIncrementCounter++;
      }

      // Handle default values
      if (value === undefined && column.defaultValue !== null) {
        value = column.defaultValue;
      }

      // Validate type
      const validation = TypeValidator.validate(
        value,
        column.type,
        column.name,
        !column.notNull
      );

      if (!validation.valid && validation.error) {
        return { success: false, error: validation.error };
      }

      preparedRow[column.name] = validation.value;
    }

    // Check constraints and add to indices
    const rowIndex = this.rows.length;

    for (const column of this.schema.columns) {
      const value = preparedRow[column.name] ?? null;

      // Check primary key constraint
      if (column.primaryKey && this.schema.primaryKey) {
        const pkIndex = this.indices.get(this.schema.primaryKey);
        if (pkIndex) {
          const violation = IndexManager.addEntry(pkIndex, value, rowIndex);
          if (violation) {
            this.rollbackIndexAdditions(preparedRow, rowIndex);
            return { success: false, error: violation };
          }
        }
      }

      // Check unique constraints
      if (column.unique) {
        const uniqueIndex = this.indices.get(column.name);
        if (uniqueIndex) {
          const violation = IndexManager.addEntry(uniqueIndex, value, rowIndex);
          if (violation) {
            // Rollback
            this.rollbackIndexAdditions(preparedRow, rowIndex);
            return { success: false, error: violation };
          }
        }
      }
    }

    // Add row to table
    this.rows.push(preparedRow);

    const result: {
      success: true;
      rowIndex: number;
      lastInsertId?: number;
    } = {
      success: true,
      rowIndex,
    };
    if (lastInsertId !== null) {
      result.lastInsertId = lastInsertId;
    }
    return result;
  }

  updateRows(
    updates: Record<string, ColumnValue>,
    filter: (row: Row, index: number) => boolean
  ): {
    success: boolean;
    rowsAffected: number;
    error?: ConstraintViolation;
  } {
    const affectedIndices: number[] = [];

    // Find rows to update
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      if (row && filter(row, i)) {
        affectedIndices.push(i);
      }
    }

    // Validate updates
    for (const [columnName, newValue] of Object.entries(updates)) {
      const column = this.schema.columns.find((c) => c.name === columnName);
      if (!column) {
        return {
          success: false,
          rowsAffected: 0,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: newValue,
            message: `Column '${columnName}' does not exist`,
          },
        };
      }

      // Validate type
      const validation = TypeValidator.validate(
        newValue,
        column.type,
        column.name,
        !column.notNull
      );

      if (!validation.valid && validation.error) {
        return {
          success: false,
          rowsAffected: 0,
          error: validation.error,
        };
      }
    }

    // Perform updates
    for (const rowIndex of affectedIndices) {
      const row = this.rows[rowIndex];
      if (!row) continue;

      for (const [columnName, newValue] of Object.entries(updates)) {
        const column = this.schema.columns.find((c) => c.name === columnName);
        if (!column) continue;

        const oldValue = row[columnName];

        // Update indices if column is indexed
        const index = this.indices.get(columnName);
        if (index && oldValue !== undefined) {
          const violation = IndexManager.updateEntry(
            index,
            oldValue,
            newValue,
            rowIndex
          );
          if (violation) {
            return {
              success: false,
              rowsAffected: 0,
              error: violation,
            };
          }
        }

        // Update the row
        row[columnName] = newValue;
      }
    }

    return {
      success: true,
      rowsAffected: affectedIndices.length,
    };
  }

  deleteRows(filter: (row: Row, index: number) => boolean): number {
    const indicesToDelete: number[] = [];

    // Find rows to delete
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      if (row && filter(row, i)) {
        indicesToDelete.push(i);
      }
    }

    // Remove from indices first
    for (const rowIndex of indicesToDelete) {
      const row = this.rows[rowIndex];
      if (!row) continue;

      for (const [columnName, index] of this.indices) {
        const value = row[columnName];
        if (value !== undefined) {
          IndexManager.removeEntry(index, value, rowIndex);
        }
      }
    }

    // Remove rows (in reverse order to maintain indices)
    for (let i = indicesToDelete.length - 1; i >= 0; i--) {
      const index = indicesToDelete[i];
      if (index !== undefined) {
        this.rows.splice(index, 1);
      }
    }

    // Rebuild all indices to fix row index references
    this.rebuildAllIndices();

    return indicesToDelete.length;
  }

  findByIndex(columnName: string, value: ColumnValue): Row[] {
    const index = this.indices.get(columnName);
    if (!index) {
      return [];
    }

    const rowIndices = IndexManager.lookup(index, value);
    return Array.from(rowIndices)
      .map((i) => this.rows[i])
      .filter((row): row is Row => row !== undefined);
  }

  getIndex(columnName: string): Index | null {
    return this.indices.get(columnName) ?? null;
  }

  toTable(): Table {
    return {
      schema: this.schema,
      rows: [...this.rows],
      indices: new Map(this.indices),
      autoIncrementCounter: this.autoIncrementCounter,
    };
  }

  private initializeIndices(): void {
    for (const column of this.schema.columns) {
      if (column.primaryKey || column.unique) {
        const index = IndexManager.createIndex(column.name, true);
        this.indices.set(column.name, index);
      }
    }
  }

  private rollbackIndexAdditions(row: Row, rowIndex: number): void {
    for (const [columnName, index] of this.indices) {
      const value = row[columnName] ?? null;
      IndexManager.removeEntry(index, value, rowIndex);
    }
  }

  private rebuildAllIndices(): void {
    for (const [columnName, index] of this.indices) {
      const values = this.rows
        .map((row, i) => ({
          value: row[columnName] ?? null,
          rowIndex: i,
        }))
        .filter((entry) => entry.value !== null);

      IndexManager.rebuild(index, values);
    }
  }
}
