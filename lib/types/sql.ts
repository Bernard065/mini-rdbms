import { DataType, ColumnValue } from './database';

/**
 * SQL statement types (discriminated union)
 */
export type SQLStatement =
  | CreateTableStatement
  | InsertStatement
  | SelectStatement
  | UpdateStatement
  | DeleteStatement
  | ShowTablesStatement
  | DescribeStatement;

// CREATE TABLE statement
export interface CreateTableStatement {
  readonly type: 'CREATE_TABLE';
  readonly tableName: string;
  readonly columns: ReadonlyArray<{
    readonly name: string;
    readonly dataType: DataType;
    readonly constraints: ReadonlyArray<ColumnConstraint>;
  }>;
}

// INSERT statement
export interface InsertStatement {
  readonly type: 'INSERT';
  readonly tableName: string;
  readonly columns: ReadonlyArray<string> | null;
  readonly values: ReadonlyArray<ReadonlyArray<ColumnValue>>;
}

// SELECT statement
export interface SelectStatement {
  readonly type: 'SELECT';
  readonly columns: ReadonlyArray<string> | '*';
  readonly from: string;
  readonly where: WhereClause | null;
  readonly join: JoinClause | null;
  readonly orderBy: OrderByClause | null;
  readonly limit: number | null;
}

// UPDATE statement
export interface UpdateStatement {
  readonly type: 'UPDATE';
  readonly tableName: string;
  readonly set: ReadonlyArray<{ column: string; value: ColumnValue }>;
  readonly where: WhereClause | null;
}

// DELETE statement
export interface DeleteStatement {
  readonly type: 'DELETE';
  readonly from: string;
  readonly where: WhereClause | null;
}

// SHOW TABLES statement
export interface ShowTablesStatement {
  readonly type: 'SHOW_TABLES';
}

// DESCRIBE statement
export interface DescribeStatement {
  readonly type: 'DESCRIBE';
  readonly tableName: string;
}

// Column constraints
export type ColumnConstraint =
  | 'PRIMARY KEY'
  | 'AUTO_INCREMENT'
  | 'UNIQUE'
  | 'NOT NULL';

// WHERE clause
export interface WhereClause {
  readonly conditions: ReadonlyArray<Condition | LogicalCondition>;
}

// Single condition
export interface Condition {
  readonly type: 'CONDITION';
  readonly column: string;
  readonly operator: ComparisonOperator;
  readonly value: ColumnValue;
}

// Logical condition (AND/OR)
export interface LogicalCondition {
  readonly type: 'LOGICAL';
  readonly operator: 'AND' | 'OR';
  readonly left: Condition | LogicalCondition;
  readonly right: Condition | LogicalCondition;
}

// Comparison operators
export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE';

// JOIN clause
export interface JoinClause {
  readonly type: 'INNER' | 'LEFT' | 'RIGHT';
  readonly table: string;
  readonly on: {
    readonly leftColumn: string;
    readonly rightColumn: string;
  };
}

// ORDER BY clause
export interface OrderByClause {
  readonly column: string;
  readonly direction: 'ASC' | 'DESC';
}

/**
 * Type guard for SQL statements
 */
export const isSQLStatement = (value: unknown): value is SQLStatement => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const statement = value as { type?: string };
  return (
    statement.type === 'CREATE_TABLE' ||
    statement.type === 'INSERT' ||
    statement.type === 'SELECT' ||
    statement.type === 'UPDATE' ||
    statement.type === 'DELETE' ||
    statement.type === 'SHOW_TABLES' ||
    statement.type === 'DESCRIBE'
  );
};
