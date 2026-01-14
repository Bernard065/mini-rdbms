/**
 * Central export point for all type definitions
 */

// Database types
export type {
  ColumnDefinition,
  ColumnValue,
  Row,
  TableSchema,
  Table,
  Database,
  Index,
  ConstraintViolation,
  DatabaseError,
} from './database';

export { DataType, isValidDataType, isValidColumnValue, isRow } from './database';

// SQL types
export type {
  SQLStatement,
  CreateTableStatement,
  InsertStatement,
  SelectStatement,
  UpdateStatement,
  DeleteStatement,
  ShowTablesStatement,
  DescribeStatement,
  ColumnConstraint,
  WhereClause,
  Condition,
  LogicalCondition,
  ComparisonOperator,
  JoinClause,
  OrderByClause,
} from './sql';

export { isSQLStatement } from './sql';

// Query result types
export type {
  QueryResult,
  SelectResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
  CreateTableResult,
  ShowTablesResult,
  DescribeResult,
  ErrorResult,
} from './query';

export {
  isSuccessResult,
  isErrorResult,
  isSelectResult,
  isInsertResult,
  isUpdateResult,
  isDeleteResult,
} from './query';
