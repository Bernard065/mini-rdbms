import { BaseParser } from './BaseParser';
import { TokenType } from './Tokenizer';
import {
  SQLStatement,
  CreateTableStatement,
  InsertStatement,
  SelectStatement,
  UpdateStatement,
  DeleteStatement,
  ShowTablesStatement,
  DescribeStatement,
  AlterTableStatement,
  DropTableStatement,
  ColumnConstraint,
  WhereClause,
  Condition,
  LogicalCondition,
  ComparisonOperator,
  JoinClause,
  OrderByClause,
  DataType,
  isValidDataType,
} from '@/lib/types';

export class SQLParser extends BaseParser {
  parse(): SQLStatement {
    if (this.match(TokenType.CREATE)) {
      return this.parseCreateTable();
    }

    if (this.match(TokenType.ALTER)) {
      return this.parseAlterTable();
    }

    if (this.match(TokenType.DROP)) {
      return this.parseDropTable();
    }

    if (this.match(TokenType.INSERT)) {
      return this.parseInsert();
    }

    if (this.match(TokenType.SELECT)) {
      return this.parseSelect();
    }

    if (this.match(TokenType.UPDATE)) {
      return this.parseUpdate();
    }

    if (this.match(TokenType.DELETE)) {
      return this.parseDelete();
    }

    if (this.match(TokenType.SHOW)) {
      return this.parseShowTables();
    }

    if (this.match(TokenType.DESCRIBE)) {
      return this.parseDescribe();
    }

    throw this.createSyntaxError('Unknown SQL statement');
  }

  // Parses ALTER TABLE statement
  private parseAlterTable(): AlterTableStatement {
    this.consume(TokenType.ALTER);
    this.consume(TokenType.TABLE);
    const tableName = this.parseIdentifier();

    if (this.match(TokenType.ADD)) {
      this.advance();
      const column = this.parseColumnDefinition();
      this.skipOptionalSemicolon();
      return {
        type: 'ALTER_TABLE',
        tableName,
        action: { kind: 'ADD_COLUMN', column },
      };
    }
    if (this.match(TokenType.DROP)) {
      this.advance();
      this.consume(TokenType.COLUMN);
      const columnName = this.parseIdentifier();
      this.skipOptionalSemicolon();
      return {
        type: 'ALTER_TABLE',
        tableName,
        action: { kind: 'DROP_COLUMN', columnName },
      };
    }
    if (this.match(TokenType.RENAME)) {
      this.advance();
      this.consume(TokenType.COLUMN);
      const oldName = this.parseIdentifier();
      this.consume(TokenType.TO);
      const newName = this.parseIdentifier();
      this.skipOptionalSemicolon();
      return {
        type: 'ALTER_TABLE',
        tableName,
        action: { kind: 'RENAME_COLUMN', oldName, newName },
      };
    }
    if (this.match(TokenType.MODIFY)) {
      this.advance();
      const column = this.parseColumnDefinition();
      this.skipOptionalSemicolon();
      return {
        type: 'ALTER_TABLE',
        tableName,
        action: { kind: 'MODIFY_COLUMN', column },
      };
    }
    throw this.createSyntaxError('Unsupported ALTER TABLE action');
  }

  // Parses DROP TABLE statement
  private parseDropTable(): DropTableStatement {
    this.consume(TokenType.DROP);
    this.consume(TokenType.TABLE);
    const tableName = this.parseIdentifier();
    this.skipOptionalSemicolon();
    return {
      type: 'DROP_TABLE',
      tableName,
    };
  }

  // Parses CREATE TABLE statement
  private parseCreateTable(): CreateTableStatement {
    this.consume(TokenType.CREATE);
    this.consume(TokenType.TABLE);

    const tableName = this.parseIdentifier();

    this.consume(TokenType.LEFT_PAREN);

    const columns = this.parseCommaSeparatedList(() =>
      this.parseColumnDefinition()
    );

    this.consume(TokenType.RIGHT_PAREN);
    this.skipOptionalSemicolon();

    return {
      type: 'CREATE_TABLE',
      tableName,
      columns,
    };
  }

  // Parses a column definition within CREATE TABLE
  private parseColumnDefinition(): {
    name: string;
    dataType: DataType;
    constraints: readonly ColumnConstraint[];
  } {
    const name = this.parseIdentifier();

    const dataTypeToken = this.currentToken.value;
    if (!isValidDataType(dataTypeToken)) {
      throw this.createSyntaxError(`Invalid data type: ${dataTypeToken}`);
    }
    const dataType = dataTypeToken as DataType;
    this.advance();

    const constraints: ColumnConstraint[] = [];

    while (
      this.match(
        TokenType.PRIMARY,
        TokenType.UNIQUE,
        TokenType.NOT,
        TokenType.AUTO_INCREMENT
      )
    ) {
      if (this.match(TokenType.PRIMARY)) {
        this.advance();
        this.consume(TokenType.KEY);
        constraints.push('PRIMARY KEY');
      } else if (this.match(TokenType.UNIQUE)) {
        this.advance();
        constraints.push('UNIQUE');
      } else if (this.match(TokenType.NOT)) {
        this.advance();
        this.consume(TokenType.NULL);
        constraints.push('NOT NULL');
      } else if (this.match(TokenType.AUTO_INCREMENT)) {
        this.advance();
        constraints.push('AUTO_INCREMENT');
      }
    }

    return { name, dataType, constraints };
  }

  // Parses INSERT statement
  private parseInsert(): InsertStatement {
    this.consume(TokenType.INSERT);
    this.consume(TokenType.INTO);

    const tableName = this.parseIdentifier();

    let columns: string[] | null = null;
    if (this.match(TokenType.LEFT_PAREN)) {
      this.advance();
      columns = this.parseCommaSeparatedList(() => this.parseIdentifier());
      this.consume(TokenType.RIGHT_PAREN);
    }

    this.consume(TokenType.VALUES);

    const values: Array<Array<string | number | boolean | null>> = [];

    do {
      this.consume(TokenType.LEFT_PAREN);
      const rowValues = this.parseCommaSeparatedList(() => this.parseLiteral());
      this.consume(TokenType.RIGHT_PAREN);
      values.push(rowValues);
    } while (this.match(TokenType.COMMA) && this.advance() !== undefined);

    this.skipOptionalSemicolon();

    return {
      type: 'INSERT',
      tableName,
      columns,
      values,
    };
  }

  // Parses SELECT statement
  private parseSelect(): SelectStatement {
    this.consume(TokenType.SELECT);

    let columns: string[] | '*';
    if (this.match(TokenType.ASTERISK)) {
      columns = '*';
      this.advance();
    } else {
      columns = this.parseCommaSeparatedList(
        () => this.parseQualifiedIdentifier().column,
        TokenType.FROM
      );
    }

    this.consume(TokenType.FROM);
    const from = this.parseIdentifier();

    let join: JoinClause | null = null;
    if (
      this.match(
        TokenType.INNER,
        TokenType.LEFT,
        TokenType.RIGHT,
        TokenType.JOIN
      )
    ) {
      join = this.parseJoin();
    }

    let where: WhereClause | null = null;
    if (this.match(TokenType.WHERE)) {
      where = this.parseWhere();
    }

    let orderBy: OrderByClause | null = null;
    if (this.match(TokenType.ORDER)) {
      orderBy = this.parseOrderBy();
    }

    let limit: number | null = null;
    if (this.match(TokenType.LIMIT)) {
      this.advance();
      const limitToken = this.consume(TokenType.NUMBER);
      limit = parseInt(limitToken.value, 10);
    }

    this.skipOptionalSemicolon();

    return {
      type: 'SELECT',
      columns,
      from,
      where,
      join,
      orderBy,
      limit,
    };
  }

  // Parses UPDATE statement
  private parseUpdate(): UpdateStatement {
    this.consume(TokenType.UPDATE);
    const tableName = this.parseIdentifier();

    this.consume(TokenType.SET);

    const set = this.parseCommaSeparatedList(() => {
      const column = this.parseIdentifier();
      this.consume(TokenType.EQUALS);
      const value = this.parseLiteral();
      return { column, value };
    }, TokenType.WHERE);

    let where: WhereClause | null = null;
    if (this.match(TokenType.WHERE)) {
      where = this.parseWhere();
    }

    this.skipOptionalSemicolon();

    return {
      type: 'UPDATE',
      tableName,
      set,
      where,
    };
  }

  // Parses DELETE statement
  private parseDelete(): DeleteStatement {
    this.consume(TokenType.DELETE);
    this.consume(TokenType.FROM);
    const from = this.parseIdentifier();

    let where: WhereClause | null = null;
    if (this.match(TokenType.WHERE)) {
      where = this.parseWhere();
    }

    this.skipOptionalSemicolon();

    return {
      type: 'DELETE',
      from,
      where,
    };
  }

  // Parses WHERE clause
  private parseWhere(): WhereClause {
    this.consume(TokenType.WHERE);

    const conditions: Array<Condition | LogicalCondition> = [];
    conditions.push(this.parseCondition());

    return { conditions };
  }

  // Parses a condition (supports logical conditions)
  private parseCondition(): Condition | LogicalCondition {
    let left: Condition | LogicalCondition = this.parseSimpleCondition();

    while (this.match(TokenType.AND, TokenType.OR)) {
      const operatorToken = this.currentToken;
      const operator = operatorToken.type === TokenType.AND ? 'AND' : 'OR';
      this.advance();

      const right = this.parseSimpleCondition();

      left = {
        type: 'LOGICAL',
        operator,
        left,
        right,
      } as LogicalCondition;
    }

    return left;
  }

  // Parses a simple condition (e.g., column = value)
  private parseSimpleCondition(): Condition {
    const column = this.parseIdentifier();

    let operator: ComparisonOperator;
    if (this.match(TokenType.EQUALS)) {
      operator = '=';
      this.advance();
    } else if (this.match(TokenType.NOT_EQUALS)) {
      operator = '!=';
      this.advance();
    } else if (this.match(TokenType.GREATER_EQUAL)) {
      operator = '>=';
      this.advance();
    } else if (this.match(TokenType.LESS_EQUAL)) {
      operator = '<=';
      this.advance();
    } else if (this.match(TokenType.GREATER_THAN)) {
      operator = '>';
      this.advance();
    } else if (this.match(TokenType.LESS_THAN)) {
      operator = '<';
      this.advance();
    } else if (this.match(TokenType.LIKE)) {
      operator = 'LIKE';
      this.advance();
    } else {
      throw this.createSyntaxError('Expected comparison operator');
    }

    const value = this.parseLiteral();

    return {
      type: 'CONDITION',
      column,
      operator,
      value,
    };
  }

  // Parses JOIN clause
  private parseJoin(): JoinClause {
    let joinType: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER';

    if (this.match(TokenType.INNER)) {
      this.advance();
      joinType = 'INNER';
    } else if (this.match(TokenType.LEFT)) {
      this.advance();
      joinType = 'LEFT';
    } else if (this.match(TokenType.RIGHT)) {
      this.advance();
      joinType = 'RIGHT';
    }

    this.consume(TokenType.JOIN);
    const table = this.parseIdentifier();

    this.consume(TokenType.ON);
    const leftColumn = this.parseIdentifier();
    this.consume(TokenType.EQUALS);
    const rightColumn = this.parseIdentifier();

    return {
      type: joinType,
      table,
      on: {
        leftColumn,
        rightColumn,
      },
    };
  }

  // Parses ORDER BY clause
  private parseOrderBy(): OrderByClause {
    this.consume(TokenType.ORDER);
    this.consume(TokenType.BY);

    const column = this.parseIdentifier();

    let direction: 'ASC' | 'DESC' = 'ASC';
    if (this.match(TokenType.ASC)) {
      this.advance();
      direction = 'ASC';
    } else if (this.match(TokenType.DESC)) {
      this.advance();
      direction = 'DESC';
    }

    return { column, direction };
  }

  // Parses SHOW TABLES statement
  private parseShowTables(): ShowTablesStatement {
    this.consume(TokenType.SHOW);
    this.consume(TokenType.TABLES);
    this.skipOptionalSemicolon();

    return { type: 'SHOW_TABLES' };
  }

  // Parses DESCRIBE statement
  private parseDescribe(): DescribeStatement {
    this.consume(TokenType.DESCRIBE);
    const tableName = this.parseIdentifier();
    this.skipOptionalSemicolon();

    return {
      type: 'DESCRIBE',
      tableName,
    };
  }
}
