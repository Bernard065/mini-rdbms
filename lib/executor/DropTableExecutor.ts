import { DropTableStatement } from '@/lib/types';
import { TableStorage } from '@/lib/storage';
import { QueryResult } from '@/lib/types';

export class DropTableExecutor {
  static execute(
    statement: DropTableStatement,
    tables: Map<string, TableStorage>
  ): QueryResult {
    const { tableName } = statement;
    if (!tables.has(tableName)) {
      return {
        success: false,
        type: 'ERROR',
        error: { type: 'TABLE_NOT_FOUND', tableName },
        executionTime: 0,
      };
    }
    tables.delete(tableName);
    return {
      success: true,
      type: 'DROP_TABLE',
      tableName,
      executionTime: 0,
    };
  }
}
