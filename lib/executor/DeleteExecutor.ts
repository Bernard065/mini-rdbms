import {
  DeleteStatement,
  WhereClause,
  Condition,
  LogicalCondition,
  Row,
  DeleteResult,
  ErrorResult,
} from '@/lib/types';
import { TableStorage } from '@/lib/storage';

// Executor for DELETE statements
export class DeleteExecutor {
  static execute(
    statement: DeleteStatement,
    tables: Map<string, TableStorage>
  ): DeleteResult | ErrorResult {
    const startTime = performance.now();

    try {
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

      const filter = statement.where
        ? (row: Row) => this.evaluateWhere(row, statement.where!)
        : () => true;

      const rowsAffected = table.deleteRows(filter);

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        type: 'DELETE',
        rowsAffected,
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

  // Evaluates the WHERE clause
  private static evaluateWhere(row: Row, where: WhereClause): boolean {
    for (const condition of where.conditions) {
      if (!this.evaluateCondition(row, condition)) {
        return false;
      }
    }
    return true;
  }

  // Evaluates a single condition
  private static evaluateCondition(
    row: Row,
    condition: Condition | LogicalCondition
  ): boolean {
    if (condition.type === 'LOGICAL') {
      const leftResult = this.evaluateCondition(row, condition.left);
      const rightResult = this.evaluateCondition(row, condition.right);

      if (condition.operator === 'AND') {
        return leftResult && rightResult;
      } else {
        return leftResult || rightResult;
      }
    }

    let columnValue = row[condition.column];
    if (columnValue === undefined) columnValue = null;
    const left = columnValue;
    const right = condition.value;
    const operator = condition.operator;

    if (left === null || right === null) {
      if (operator === '=') return left === right;
      if (operator === '!=') return left !== right;
      return false;
    }

    switch (operator) {
      case '=':
        return this.normalize(left) === this.normalize(right);
      case '!=':
        return this.normalize(left) !== this.normalize(right);
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

  private static normalize(
    value: string | number | boolean | Date | null
  ): string | number | boolean | Date | null {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  }

  private static numericCompare(
    left: string | number | boolean | Date | null,
    right: string | number | boolean | Date | null
  ): number {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum === null || rightNum === null) {
      return 0;
    }

    return leftNum - rightNum;
  }

  private static toNumber(
    value: string | number | boolean | Date | null
  ): number | null {
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

  private static likeCompare(
    left: string | number | boolean | Date | null,
    pattern: string | number | boolean | Date | null
  ): boolean {
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
}
