import { Row, TableSchema, DatabaseError } from './database';

/**
 * Query execution result (discriminated union)
 */
export type QueryResult =
  | SelectResult
  | InsertResult
  | UpdateResult
  | DeleteResult
  | CreateTableResult
  | ShowTablesResult
  | DescribeResult
  | ErrorResult;

// Successful SELECT result
export interface SelectResult {
  readonly success: true;
  readonly type: 'SELECT';
  readonly rows: ReadonlyArray<Row>;
  readonly rowCount: number;
  readonly executionTime: number;
}

// Successful INSERT result
export interface InsertResult {
  readonly success: true;
  readonly type: 'INSERT';
  readonly rowsAffected: number;
  readonly lastInsertId: number | null;
  readonly executionTime: number;
}

// Successful UPDATE result
export interface UpdateResult {
  readonly success: true;
  readonly type: 'UPDATE';
  readonly rowsAffected: number;
  readonly executionTime: number;
}

// Successful DELETE result
export interface DeleteResult {
  readonly success: true;
  readonly type: 'DELETE';
  readonly rowsAffected: number;
  readonly executionTime: number;
}

// Successful CREATE TABLE result
export interface CreateTableResult {
  readonly success: true;
  readonly type: 'CREATE_TABLE';
  readonly tableName: string;
  readonly executionTime: number;
}

// SHOW TABLES result
export interface ShowTablesResult {
  readonly success: true;
  readonly type: 'SHOW_TABLES';
  readonly tables: ReadonlyArray<string>;
  readonly executionTime: number;
}

// DESCRIBE table result
export interface DescribeResult {
  readonly success: true;
  readonly type: 'DESCRIBE';
  readonly schema: TableSchema;
  readonly executionTime: number;
}

// Error result
export interface ErrorResult {
  readonly success: false;
  readonly type: 'ERROR';
  readonly error: DatabaseError;
  readonly executionTime: number;
}

/**
 * Type guards for query results
 */
export const isSuccessResult = (
  result: QueryResult
): result is Exclude<QueryResult, ErrorResult> => {
  return result.success === true;
};

export const isErrorResult = (result: QueryResult): result is ErrorResult => {
  return result.success === false;
};

export const isSelectResult = (result: QueryResult): result is SelectResult => {
  return result.success && result.type === 'SELECT';
};

export const isInsertResult = (result: QueryResult): result is InsertResult => {
  return result.success && result.type === 'INSERT';
};

export const isUpdateResult = (result: QueryResult): result is UpdateResult => {
  return result.success && result.type === 'UPDATE';
};

export const isDeleteResult = (result: QueryResult): result is DeleteResult => {
  return result.success && result.type === 'DELETE';
};
