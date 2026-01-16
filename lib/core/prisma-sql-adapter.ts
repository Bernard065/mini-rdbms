import { SQLStatement } from '@/lib/types/sql';
import { QueryResult } from '@/lib/types/query';
import { prisma } from '@/lib/prisma';

export async function executeSQLOnPrisma(
  statement: SQLStatement
): Promise<QueryResult> {
  switch (statement.type) {
    case 'SELECT': {
      if (statement.from === 'customers' || statement.from === 'customer') {
        const customers = await prisma.customer.findMany();
        return {
          success: true,
          type: 'SELECT',
          rows: customers,
          rowCount: customers.length,
          executionTime: 0,
        };
      }
      if (statement.from === 'orders' || statement.from === 'order') {
        const orders = await prisma.order.findMany();
        return {
          success: true,
          type: 'SELECT',
          rows: orders,
          rowCount: orders.length,
          executionTime: 0,
        };
      }
      return {
        success: false,
        type: 'ERROR',
        error: { type: 'TABLE_NOT_FOUND', tableName: statement.from },
        executionTime: 0,
      };
    }
    case 'INSERT': {
      if (
        statement.tableName === 'customers' ||
        statement.tableName === 'customer'
      ) {
        let lastInsertId = null;
        let rowsAffected = 0;
        const results = await Promise.all(
          statement.values.map(async (row) => {
            if (!row || row.length < 2) return null;
            const [name, email] = row;
            try {
              const customer = await prisma.customer.create({
                data: { name: String(name), email: String(email) },
              });
              lastInsertId = customer.id;
              rowsAffected++;
              return customer;
            } catch {
              return null;
            }
          })
        );
        rowsAffected = results.filter(Boolean).length;
        return {
          success: true,
          type: 'INSERT',
          rowsAffected,
          lastInsertId,
          executionTime: 0,
        };
      }
      if (statement.tableName === 'orders' || statement.tableName === 'order') {
        let lastInsertId = null;
        let rowsAffected = 0;
        const results = await Promise.all(
          statement.values.map(async (row) => {
            if (!row || row.length < 3) return null;
            const [customerId, product, amount] = row;
            try {
              const order = await prisma.order.create({
                data: {
                  customerId: Number(customerId),
                  product: String(product),
                  amount: Number(amount),
                },
              });
              lastInsertId = order.id;
              rowsAffected++;
              return order;
            } catch {
              return null;
            }
          })
        );
        rowsAffected = results.filter(Boolean).length;
        return {
          success: true,
          type: 'INSERT',
          rowsAffected,
          lastInsertId,
          executionTime: 0,
        };
      }
      return {
        success: false,
        type: 'ERROR',
        error: { type: 'TABLE_NOT_FOUND', tableName: statement.tableName },
        executionTime: 0,
      };
    }
    case 'SHOW_TABLES': {
      return {
        success: true,
        type: 'SHOW_TABLES',
        tables: ['customers', 'orders'],
        executionTime: 0,
      };
    }
    case 'CREATE_TABLE': {
      if (
        statement.tableName === 'customers' ||
        statement.tableName === 'orders'
      ) {
        if (statement.ifNotExists) {
          return {
            success: true,
            type: 'CREATE_TABLE',
            tableName: statement.tableName,
            executionTime: 0,
          };
        } else {
          return {
            success: false,
            type: 'ERROR',
            error: {
              type: 'TABLE_ALREADY_EXISTS',
              tableName: statement.tableName,
            },
            executionTime: 0,
          };
        }
      }
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'EXECUTION_ERROR',
          message: 'Only customers and orders tables are supported.',
        },
        executionTime: 0,
      };
    }
    case 'UPDATE': {
      const update = statement as import('@/lib/types').UpdateStatement;
      const data: Record<string, unknown> = {};
      for (const { column, value } of update.set) {
        data[column] = value;
      }
      const where: Record<string, unknown> = {};
      if (update.where && update.where.conditions.length > 0) {
        for (const cond of update.where.conditions) {
          if (cond.type === 'CONDITION' && cond.operator === '=') {
            where[cond.column] = cond.value;
          }
        }
      }
      try {
        let rowsAffected = 0;
        if (
          update.tableName === 'customers' ||
          update.tableName === 'customer'
        ) {
          const result = await prisma.customer.updateMany({ data, where });
          rowsAffected = result.count;
        } else if (
          update.tableName === 'orders' ||
          update.tableName === 'order'
        ) {
          const result = await prisma.order.updateMany({ data, where });
          rowsAffected = result.count;
        } else {
          return {
            success: false,
            type: 'ERROR',
            error: { type: 'TABLE_NOT_FOUND', tableName: update.tableName },
            executionTime: 0,
          };
        }
        return {
          success: true,
          type: 'UPDATE',
          rowsAffected,
          executionTime: 0,
        };
      } catch (error) {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Update failed';
        return {
          success: false,
          type: 'ERROR',
          error: { type: 'EXECUTION_ERROR', message },
          executionTime: 0,
        };
      }
    }
    case 'DELETE': {
      const del = statement as import('@/lib/types').DeleteStatement;
      const where: Record<string, unknown> = {};
      if (del.where && del.where.conditions.length > 0) {
        for (const cond of del.where.conditions) {
          if (cond.type === 'CONDITION' && cond.operator === '=') {
            where[cond.column] = cond.value;
          }
        }
      }
      try {
        let rowsAffected = 0;
        if (del.from === 'customers' || del.from === 'customer') {
          const result = await prisma.customer.deleteMany({ where });
          rowsAffected = result.count;
        } else if (del.from === 'orders' || del.from === 'order') {
          const result = await prisma.order.deleteMany({ where });
          rowsAffected = result.count;
        } else {
          return {
            success: false,
            type: 'ERROR',
            error: { type: 'TABLE_NOT_FOUND', tableName: del.from },
            executionTime: 0,
          };
        }
        return {
          success: true,
          type: 'DELETE',
          rowsAffected,
          executionTime: 0,
        };
      } catch (error) {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Delete failed';
        return {
          success: false,
          type: 'ERROR',
          error: { type: 'EXECUTION_ERROR', message },
          executionTime: 0,
        };
      }
    }
    default:
      return {
        success: false,
        type: 'ERROR',
        error: {
          type: 'EXECUTION_ERROR',
          message: 'Statement type not supported yet',
        },
        executionTime: 0,
      };
  }
}
