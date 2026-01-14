// Supported SQL data types
export enum DataType {
  INTEGER = 'INTEGER',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  REAL = 'REAL',
  DATE = 'DATE',
}

// Column definition for a table schema
export interface ColumnDefinition {
  readonly name: string;
  readonly type: DataType;
  readonly primaryKey: boolean;
  readonly autoIncrement: boolean;
  readonly unique: boolean;
  readonly notNull: boolean;
  readonly defaultValue: ColumnValue | null;
}

// Valid column value types
export type ColumnValue = string | number | boolean | Date | null;

// Row data structure (record in a table)
export type Row = Record<string, ColumnValue>;

// Table schema definition
export interface TableSchema {
  readonly name: string;
  readonly columns: ReadonlyArray<ColumnDefinition>;
  readonly primaryKey: string | null;
  readonly uniqueColumns: ReadonlyArray<string>;
}

// Index structure for fast lookups
export interface Index {
  readonly columnName: string;
  readonly unique: boolean;
  readonly entries: Map<ColumnValue, Set<number>>;
}

// Complete table data structure
export interface Table {
  readonly schema: TableSchema;
  readonly rows: Row[];
  readonly indices: Map<string, Index>;
  readonly autoIncrementCounter: number;
}

// Database structure containing all tables
export interface Database {
  readonly tables: Map<string, Table>;
}

//Details about a constraint violation error.
export interface ConstraintViolation {
  readonly type: 'PRIMARY_KEY' | 'UNIQUE' | 'NOT_NULL' | 'TYPE_MISMATCH';
  readonly column: string;
  readonly value: ColumnValue;
  readonly message: string;
}

// Database error types for common failure cases.
export type DatabaseError =
  | { readonly type: 'TABLE_NOT_FOUND'; readonly tableName: string }
  | { readonly type: 'TABLE_ALREADY_EXISTS'; readonly tableName: string }
  | { readonly type: 'COLUMN_NOT_FOUND'; readonly columnName: string }
  | {
      readonly type: 'CONSTRAINT_VIOLATION';
      readonly violation: ConstraintViolation;
    }
  | { readonly type: 'SYNTAX_ERROR'; readonly message: string }
  | { readonly type: 'EXECUTION_ERROR'; readonly message: string };

// Type guards for runtime type checking of database types.
export const isValidDataType = (value: string): value is DataType => {
  return Object.values(DataType).includes(value as DataType);
};

export const isValidColumnValue = (value: unknown): value is ColumnValue => {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  );
};

export const isRow = (value: unknown): value is Row => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.values(value).every(isValidColumnValue);
};
