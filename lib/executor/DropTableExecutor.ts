import { DropTableStatement } from '@/lib/types';
import { TableStorage } from '@/lib/storage';
import { QueryResult } from '@/lib/types';

export class DropTableExecutor {
  static execute(
    statement: DropTableStatement,
    tables: Map<string, TableStorage>
  ): QueryResult {
    const { tableName, ifExists } = statement;
    if (!tables.has(tableName)) {
      if (ifExists) {
        // Table doesn't exist but IF EXISTS was specified, return success
        return {
          success: true,
          type: 'DROP_TABLE',
          tableName,
          executionTime: 0,
        };
      }
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
