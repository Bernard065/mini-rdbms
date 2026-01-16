import { DataType, ColumnValue } from './database';

export type SQLStatement =
  | CreateTableStatement
  | InsertStatement
  | SelectStatement
  | UpdateStatement
  | DeleteStatement
  | ShowTablesStatement
  | DescribeStatement
  | AlterTableStatement
  | DropTableStatement
  | BeginTransactionStatement
  | CommitTransactionStatement
  | RollbackTransactionStatement;

export interface BeginTransactionStatement {
  readonly type: 'BEGIN';
}

export interface CommitTransactionStatement {
  readonly type: 'COMMIT';
}

export interface RollbackTransactionStatement {
  readonly type: 'ROLLBACK';
}
export interface AlterTableStatement {
  readonly type: 'ALTER_TABLE';
  readonly tableName: string;
  readonly action: AlterTableAction;
}

export type AlterTableAction =
  | {
      kind: 'ADD_COLUMN';
      column: {
        name: string;
        dataType: DataType;
        constraints: ReadonlyArray<ColumnConstraint>;
      };
    }
  | { kind: 'DROP_COLUMN'; columnName: string }
  | { kind: 'RENAME_COLUMN'; oldName: string; newName: string }
  | {
      kind: 'MODIFY_COLUMN';
      column: {
        name: string;
        dataType: DataType;
        constraints: ReadonlyArray<ColumnConstraint>;
      };
    };

export interface DropTableStatement {
  readonly type: 'DROP_TABLE';
  readonly tableName: string;
  readonly ifExists?: boolean;
}

export interface CreateTableStatement {
  readonly type: 'CREATE_TABLE';
  readonly tableName: string;
  readonly columns: ReadonlyArray<{
    readonly name: string;
    readonly dataType: DataType;
    readonly constraints: ReadonlyArray<ColumnConstraint>;
  }>;
  readonly ifNotExists?: boolean;
}

export interface InsertStatement {
  readonly type: 'INSERT';
  readonly tableName: string;
  readonly columns: ReadonlyArray<string> | null;
  readonly values: ReadonlyArray<ReadonlyArray<ColumnValue>>;
}

export interface SelectStatement {
  readonly type: 'SELECT';
  readonly columns: ReadonlyArray<string> | '*';
  readonly from: string;
  readonly where: WhereClause | null;
  readonly join: JoinClause | null;
  readonly orderBy: OrderByClause | null;
  readonly limit: number | null;
}

export interface UpdateStatement {
  readonly type: 'UPDATE';
  readonly tableName: string;
  readonly set: ReadonlyArray<{ column: string; value: ColumnValue }>;
  readonly where: WhereClause | null;
}

export interface DeleteStatement {
  readonly type: 'DELETE';
  readonly from: string;
  readonly where: WhereClause | null;
}

export interface ShowTablesStatement {
  readonly type: 'SHOW_TABLES';
}

export interface DescribeStatement {
  readonly type: 'DESCRIBE';
  readonly tableName: string;
}

export type ColumnConstraint =
  | 'PRIMARY KEY'
  | 'AUTO_INCREMENT'
  | 'UNIQUE'
  | 'NOT NULL';

export interface WhereClause {
  readonly conditions: ReadonlyArray<Condition | LogicalCondition>;
}

export interface Condition {
  readonly type: 'CONDITION';
  readonly column: string;
  readonly operator: ComparisonOperator;
  readonly value: ColumnValue;
}

export interface LogicalCondition {
  readonly type: 'LOGICAL';
  readonly operator: 'AND' | 'OR';
  readonly left: Condition | LogicalCondition;
  readonly right: Condition | LogicalCondition;
}

export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE';

export interface JoinClause {
  readonly type: 'INNER' | 'LEFT' | 'RIGHT';
  readonly table: string;
  readonly on: {
    readonly leftColumn: string;
    readonly rightColumn: string;
  };
}

export interface OrderByClause {
  readonly column: string;
  readonly direction: 'ASC' | 'DESC';
}

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
    statement.type === 'DESCRIBE' ||
    statement.type === 'ALTER_TABLE' ||
    statement.type === 'DROP_TABLE'
  );
};
