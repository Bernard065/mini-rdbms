import {
  ShowTablesStatement,
  DescribeStatement,
  ShowTablesResult,
  DescribeResult,
  ErrorResult,
} from '@/lib/types';
import { TableStorage } from '@/lib/storage';

// Executor for META statements like SHOW TABLES and DESCRIBE
export class MetaExecutor {
  static executeShowTables(
    _statement: ShowTablesStatement,
    tables: Map<string, TableStorage>
  ): ShowTablesResult {
    const startTime = performance.now();
    const tableNames = Array.from(tables.keys()).sort();
    return {
      success: true,
      type: 'SHOW_TABLES',
      tables: tableNames,
      executionTime: performance.now() - startTime,
    };
  }

  // Executor for DESCRIBE statements
  static executeDescribe(
    statement: DescribeStatement,
    tables: Map<string, TableStorage>
  ): DescribeResult | ErrorResult {
    const startTime = performance.now();

    const table = tables.get(statement.tableName);
    if (!table) {
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'TABLE_NOT_FOUND',
          tableName: statement.tableName,
        },
        executionTime: performance.now() - startTime,
      };
    }

    const schema = table.getSchema();

    return {
      success: true,
      type: 'DESCRIBE',
      schema,
      executionTime: performance.now() - startTime,
    };
  }
}
