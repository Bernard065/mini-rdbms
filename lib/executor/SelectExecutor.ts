import {
  SelectStatement,
  WhereClause,
  Condition,
  LogicalCondition,
  ComparisonOperator,
  Row,
  ColumnValue,
  SelectResult,
  ErrorResult,
} from '@/lib/types';
import { TableStorage } from '@/lib/storage';

// Executor for SELECT statements
export class SelectExecutor {
  static execute(
    statement: SelectStatement,
    tables: Map<string, TableStorage>
  ): SelectResult | ErrorResult {
    const startTime = performance.now();

    try {
      // Get the main table
      const table = tables.get(statement.from);
      if (!table) {
        return {
          success: false,
          type: 'ERROR',
          error: {
            type: 'TABLE_NOT_FOUND',
            tableName: statement.from,
          },
          executionTime: performance.now() - startTime,
        };
      }

      // Get all rows
      let rows = Array.from(table.getRows());

      // Apply WHERE filter
      if (statement.where) {
        rows = this.filterRows(rows, statement.where, table);
      }

      // Apply JOIN if present
      if (statement.join) {
        const joinedTable = tables.get(statement.join.table);
        if (!joinedTable) {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'TABLE_NOT_FOUND',
              tableName: statement.join.table,
            },
            executionTime: performance.now() - startTime,
          };
        }

        rows = this.executeJoin(
          rows,
          Array.from(joinedTable.getRows()),
          statement.join.type,
          statement.join.on,
          statement.from,
          statement.join.table
        );
      }

      // Apply column projection
      if (statement.columns !== '*') {
        // Convert readonly string[] to string[]
        rows = this.projectColumns(rows, Array.from(statement.columns));
      }

      // Apply ORDER BY
      if (statement.orderBy) {
        rows = this.sortRows(
          rows,
          statement.orderBy.column,
          statement.orderBy.direction
        );
      }

      // Apply LIMIT
      if (statement.limit !== null) {
        rows = rows.slice(0, statement.limit);
      }

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        type: 'SELECT',
        rows,
        rowCount: rows.length,
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

  // Filters rows based on WHERE clause
  private static filterRows(
    rows: Row[],
    where: WhereClause,
    table: TableStorage
  ): Row[] {
    return rows.filter((row) => {
      for (const condition of where.conditions) {
        if (!this.evaluateCondition(row, condition, table)) {
          return false;
        }
      }
      return true;
    });
  }

  // Evaluates a single condition (simple or logical)
  private static evaluateCondition(
    row: Row,
    condition: Condition | LogicalCondition,
    table: TableStorage
  ): boolean {
    if (condition.type === 'LOGICAL') {
      const leftResult = this.evaluateCondition(row, condition.left, table);
      const rightResult = this.evaluateCondition(row, condition.right, table);

      if (condition.operator === 'AND') {
        return leftResult && rightResult;
      } else {
        return leftResult || rightResult;
      }
    }

    let columnValue = row[condition.column];
    if (columnValue === undefined) columnValue = null;
    return this.compareValues(columnValue, condition.operator, condition.value);
  }

  // Compares two values based on the operator
  private static compareValues(
    left: ColumnValue,
    operator: ComparisonOperator,
    right: ColumnValue
  ): boolean {
    if (left === null || right === null) {
      if (operator === '=') return left === right;
      if (operator === '!=') return left !== right;
      return false;
    }

    switch (operator) {
      case '=':
        return (
          this.normalizeForComparison(left) ===
          this.normalizeForComparison(right)
        );

      case '!=':
        return (
          this.normalizeForComparison(left) !==
          this.normalizeForComparison(right)
        );

      case '>':
        return this.numericCompare(left, right) > 0;

      case '<':
        return this.numericCompare(left, right) < 0;

      case '>=':
        return this.numericCompare(left, right) >= 0;

      case '<=':
        return this.numericCompare(left, right) <= 0;

      case 'LIKE':
        return this.likeCompare(left, right);

      default:
        return false;
    }
  }

  // Normalizes value for comparison (e.g., case-insensitive for strings)
  private static normalizeForComparison(value: ColumnValue): ColumnValue {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  }

  // Numeric comparison helper
  private static numericCompare(left: ColumnValue, right: ColumnValue): number {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum === null || rightNum === null) {
      return 0;
    }

    return leftNum - rightNum;
  }

  // Converts a ColumnValue to number if possible
  private static toNumber(value: ColumnValue): number | null {
    if (typeof value === 'number') {
      return value;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  // LIKE comparison helper
  private static likeCompare(left: ColumnValue, pattern: ColumnValue): boolean {
    if (typeof left !== 'string' || typeof pattern !== 'string') {
      return false;
    }

    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/%/g, '.*')
      .replace(/_/g, '.');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(left);
  }

  // Projects specified columns
  private static projectColumns(rows: Row[], columns: string[]): Row[] {
    return rows.map((row) => {
      const projected: Row = {};
      for (const column of columns) {
        if (column in row) {
          projected[column] = row[column] === undefined ? null : row[column];
        } else {
          projected[column] = null;
        }
      }
      return projected;
    });
  }

  // Sorts rows based on ORDER BY clause
  private static sortRows(
    rows: Row[],
    column: string,
    direction: 'ASC' | 'DESC'
  ): Row[] {
    const sorted = [...rows].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      let result = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        result = aVal.getTime() - bVal.getTime();
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }

      return direction === 'DESC' ? -result : result;
    });

    return sorted;
  }

  // Executes JOIN operation
  private static executeJoin(
    leftRows: Row[],
    rightRows: Row[],
    joinType: 'INNER' | 'LEFT' | 'RIGHT',
    on: { leftColumn: string; rightColumn: string },
    leftTableName: string,
    rightTableName: string
  ): Row[] {
    const result: Row[] = [];

    if (joinType === 'INNER') {
      // INNER JOIN: only matching rows
      for (const leftRow of leftRows) {
        for (const rightRow of rightRows) {
          if (leftRow[on.leftColumn] === rightRow[on.rightColumn]) {
            result.push(
              this.mergeRows(leftRow, rightRow, leftTableName, rightTableName)
            );
          }
        }
      }
    } else if (joinType === 'LEFT') {
      // LEFT JOIN: all left rows, matched right rows or nulls
      for (const leftRow of leftRows) {
        let matched = false;
        for (const rightRow of rightRows) {
          if (leftRow[on.leftColumn] === rightRow[on.rightColumn]) {
            result.push(
              this.mergeRows(leftRow, rightRow, leftTableName, rightTableName)
            );
            matched = true;
          }
        }
        if (!matched) {
          result.push(
            this.mergeRows(
              leftRow,
              this.nullRow(rightRows[0]),
              leftTableName,
              rightTableName
            )
          );
        }
      }
    } else if (joinType === 'RIGHT') {
      // RIGHT JOIN: all right rows, matched left rows or nulls
      for (const rightRow of rightRows) {
        let matched = false;
        for (const leftRow of leftRows) {
          if (leftRow[on.leftColumn] === rightRow[on.rightColumn]) {
            result.push(
              this.mergeRows(leftRow, rightRow, leftTableName, rightTableName)
            );
            matched = true;
          }
        }
        if (!matched) {
          result.push(
            this.mergeRows(
              this.nullRow(leftRows[0]),
              rightRow,
              leftTableName,
              rightTableName
            )
          );
        }
      }
    }

    return result;
  }

  // Merges two rows with table name prefixes
  private static mergeRows(
    left: Row | undefined,
    right: Row | undefined,
    leftTableName: string,
    rightTableName: string
  ): Row {
    const merged: Row = {};

    if (left) {
      for (const [key, value] of Object.entries(left)) {
        merged[`${leftTableName}.${key}`] = value;
      }
    }

    if (right) {
      for (const [key, value] of Object.entries(right)) {
        merged[`${rightTableName}.${key}`] = value;
      }
    }

    return merged;
  }

  // Creates a null row based on the template
  private static nullRow(template: Row | undefined): Row {
    if (!template) return {};

    const nullRow: Row = {};
    for (const key of Object.keys(template)) {
      nullRow[key] = null;
    }
    return nullRow;
  }
}
