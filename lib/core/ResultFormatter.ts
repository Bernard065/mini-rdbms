import { ErrorResult, QueryResult, Row, TableSchema } from '@/lib/types';

// Formats query results for display
export class ResultFormatter {
  static format(result: QueryResult): string {
    if (!result.success) {
      return this.formatError(result);
    }

    switch (result.type) {
      case 'SELECT':
        return this.formatSelectResult(
          result.rows,
          result.rowCount,
          result.executionTime
        );

      case 'INSERT':
        return this.formatInsertResult(
          result.rowsAffected,
          result.lastInsertId,
          result.executionTime
        );

      case 'UPDATE':
        return this.formatUpdateResult(
          result.rowsAffected,
          result.executionTime
        );

      case 'DELETE':
        return this.formatDeleteResult(
          result.rowsAffected,
          result.executionTime
        );

      case 'CREATE_TABLE':
        return this.formatCreateTableResult(
          result.tableName,
          result.executionTime
        );

      case 'SHOW_TABLES':
        return this.formatShowTablesResult(result.tables, result.executionTime);

      case 'DESCRIBE':
        return this.formatDescribeResult(result.schema, result.executionTime);

      default:
        return 'Unknown result type';
    }
  }

  // Formats SELECT result
  private static formatSelectResult(
    rows: readonly Row[],
    rowCount: number,
    executionTime: number
  ): string {
    if (rows.length === 0) {
      return `Empty set (${this.formatTime(executionTime)})`;
    }

    const columns = this.getColumnNames(rows);

    const widths = this.calculateColumnWidths(columns, rows);

    const lines: string[] = [];

    lines.push(this.buildSeparator(columns, widths));

    lines.push(this.buildRow(columns, widths, columns));

    lines.push(this.buildSeparator(columns, widths));

    for (const row of rows) {
      const values = columns.map((col) => this.formatValue(row[col]));
      lines.push(this.buildRow(columns, widths, values));
    }

    lines.push(this.buildSeparator(columns, widths));

    lines.push(
      `${rowCount} row${rowCount !== 1 ? 's' : ''} in set (${this.formatTime(executionTime)})`
    );

    return lines.join('\n');
  }

  // Formats INSERT result
  private static formatInsertResult(
    rowsAffected: number,
    lastInsertId: number | null,
    executionTime: number
  ): string {
    const idInfo =
      lastInsertId !== null ? `, last insert id: ${lastInsertId}` : '';
    return `Query OK, ${rowsAffected} row${rowsAffected !== 1 ? 's' : ''} affected${idInfo} (${this.formatTime(executionTime)})`;
  }

  // Formats UPDATE result
  private static formatUpdateResult(
    rowsAffected: number,
    executionTime: number
  ): string {
    return `Query OK, ${rowsAffected} row${rowsAffected !== 1 ? 's' : ''} affected (${this.formatTime(executionTime)})`;
  }

  // Formats DELETE result
  private static formatDeleteResult(
    rowsAffected: number,
    executionTime: number
  ): string {
    return `Query OK, ${rowsAffected} row${rowsAffected !== 1 ? 's' : ''} deleted (${this.formatTime(executionTime)})`;
  }

  // Formats CREATE TABLE result
  private static formatCreateTableResult(
    tableName: string,
    executionTime: number
  ): string {
    return `Table '${tableName}' created (${this.formatTime(executionTime)})`;
  }

  // Formats SHOW TABLES result
  private static formatShowTablesResult(
    tables: readonly string[],
    executionTime: number
  ): string {
    if (tables.length === 0) {
      return `Empty set (${this.formatTime(executionTime)})`;
    }

    const lines: string[] = [];
    const header = 'Tables';
    const width = Math.max(header.length, ...tables.map((t) => t.length));

    lines.push('+' + '-'.repeat(width + 2) + '+');
    lines.push('| ' + header.padEnd(width) + ' |');
    lines.push('+' + '-'.repeat(width + 2) + '+');

    for (const table of tables) {
      lines.push('| ' + table.padEnd(width) + ' |');
    }

    lines.push('+' + '-'.repeat(width + 2) + '+');
    lines.push(
      `${tables.length} row${tables.length !== 1 ? 's' : ''} in set (${this.formatTime(executionTime)})`
    );

    return lines.join('\n');
  }

  // Formats DESCRIBE result
  private static formatDescribeResult(
    schema: TableSchema,
    executionTime: number
  ): string {
    const lines: string[] = [];

    const columns = ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'];
    const widths = {
      Field: Math.max(5, ...schema.columns.map((c) => c.name.length)),
      Type: Math.max(4, ...schema.columns.map((c) => c.type.length)),
      Null: 4,
      Key: 3,
      Default: 7,
      Extra: 14,
    };

    lines.push(this.buildDescribeSeparator(widths));
    lines.push(this.buildDescribeRow(columns, widths));
    lines.push(this.buildDescribeSeparator(widths));

    for (const col of schema.columns) {
      const row = [
        col.name,
        col.type,
        col.notNull ? 'NO' : 'YES',
        col.primaryKey ? 'PRI' : col.unique ? 'UNI' : '',
        col.defaultValue !== null ? String(col.defaultValue) : 'NULL',
        col.autoIncrement ? 'AUTO_INCREMENT' : '',
      ];
      lines.push(this.buildDescribeRow(row, widths));
    }

    lines.push(this.buildDescribeSeparator(widths));
    lines.push(
      `${schema.columns.length} row${schema.columns.length !== 1 ? 's' : ''} in set (${this.formatTime(executionTime)})`
    );

    return lines.join('\n');
  }

  // Formats error result
  private static formatError(result: ErrorResult): string {
    const error = result.error;

    switch (error.type) {
      case 'TABLE_NOT_FOUND':
        return `ERROR: Table '${error.tableName}' doesn't exist`;

      case 'TABLE_ALREADY_EXISTS':
        return `ERROR: Table '${error.tableName}' already exists`;

      case 'COLUMN_NOT_FOUND':
        return `ERROR: Unknown column '${error.columnName}'`;

      case 'CONSTRAINT_VIOLATION':
        return `ERROR: ${error.violation.message}`;

      case 'SYNTAX_ERROR':
        return `ERROR: Syntax error - ${error.message}`;

      case 'EXECUTION_ERROR':
        return `ERROR: ${error.message}`;

      default:
        return 'ERROR: Unknown error';
    }
  }

  // Helper: Get all column names from rows
  private static getColumnNames(rows: readonly Row[]): string[] {
    const columnSet = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        columnSet.add(key);
      }
    }
    return Array.from(columnSet).sort();
  }

  // Helper: Calculate column widths for formatting
  private static calculateColumnWidths(
    columns: string[],
    rows: readonly Row[]
  ): Record<string, number> {
    const widths: Record<string, number> = {};

    for (const col of columns) {
      let maxWidth = col.length;
      for (const row of rows) {
        const value = this.formatValue(row[col]);
        maxWidth = Math.max(maxWidth, value.length);
      }
      widths[col] = maxWidth;
    }

    return widths;
  }

  // Helper: Build table separator
  private static buildSeparator(
    columns: string[],
    widths: Record<string, number>
  ): string {
    const parts = columns.map((col) => '-'.repeat(widths[col]! + 2));
    return '+' + parts.join('+') + '+';
  }

  // Helper: Build table row
  private static buildRow(
    columns: string[],
    widths: Record<string, number>,
    values: string[]
  ): string {
    const parts = columns.map((col, i) => {
      const width = widths[col]!;
      const value = values[i] ?? '';
      return ' ' + value.padEnd(width) + ' ';
    });
    return '|' + parts.join('|') + '|';
  }

  // Helper: Build DESCRIBE separator
  private static buildDescribeSeparator(
    widths: Record<string, number>
  ): string {
    return (
      '+' +
      Object.values(widths)
        .map((w) => '-'.repeat(w + 2))
        .join('+') +
      '+'
    );
  }

  // Helper: Build DESCRIBE row
  private static buildDescribeRow(
    values: string[],
    widths: Record<string, number>
  ): string {
    const keys = Object.keys(widths);
    const parts = values.map((val, i) => {
      const width = widths[keys[i]!]!;
      return ' ' + val.padEnd(width) + ' ';
    });
    return '|' + parts.join('|') + '|';
  }

  // Helper: Format individual value
  private static formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }

  // Helper: Format execution time
  private static formatTime(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(2)} μs`;
    }
    if (ms < 1000) {
      return `${ms.toFixed(2)} ms`;
    }
    return `${(ms / 1000).toFixed(2)} sec`;
  }
}
