import { NextRequest, NextResponse } from 'next/server';
import { SQLParser } from '@/lib/parser/SQLParser';
import { isSQLStatement } from '@/lib/types/sql';
import { executeSQLOnPrisma } from '@/lib/core/prisma-sql-adapter';

export async function POST(req: NextRequest) {
  const { sql } = await req.json();
  if (typeof sql !== 'string' || !sql.trim()) {
    return NextResponse.json(
      {
        success: false,
        type: 'ERROR',
        error: {
          type: 'SYNTAX_ERROR',
          message: 'No SQL provided',
        },
        executionTime: 0,
      },
      { status: 400 }
    );
  }

  try {
    const parser = new SQLParser(sql.trim());
    const statement = parser.parse();
    if (!isSQLStatement(statement)) {
      return NextResponse.json(
        {
          success: false,
          type: 'ERROR',
          error: {
            type: 'SYNTAX_ERROR',
            message: 'Invalid or unsupported SQL statement',
          },
          executionTime: 0,
        },
        { status: 400 }
      );
    }
    const result = await executeSQLOnPrisma(statement);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'SQL execution failed';
    return NextResponse.json(
      {
        success: false,
        type: 'ERROR',
        error: {
          type: 'EXECUTION_ERROR',
          message,
        },
        executionTime: 0,
      },
      { status: 400 }
    );
  }
}
