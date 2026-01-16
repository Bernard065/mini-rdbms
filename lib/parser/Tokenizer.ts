export enum TokenType {
  BEGIN = 'BEGIN',
  COMMIT = 'COMMIT',
  ROLLBACK = 'ROLLBACK',
  ADD = 'ADD',
  COLUMN = 'COLUMN',
  RENAME = 'RENAME',
  TO = 'TO',
  MODIFY = 'MODIFY',
  SELECT = 'SELECT',
  FROM = 'FROM',
  WHERE = 'WHERE',
  INSERT = 'INSERT',
  INTO = 'INTO',
  VALUES = 'VALUES',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SET = 'SET',
  CREATE = 'CREATE',
  TABLE = 'TABLE',
  DROP = 'DROP',
  ALTER = 'ALTER',
  PRIMARY = 'PRIMARY',
  KEY = 'KEY',
  UNIQUE = 'UNIQUE',
  NOT = 'NOT',
  NULL = 'NULL',
  AUTO_INCREMENT = 'AUTO_INCREMENT',
  DEFAULT = 'DEFAULT',
  AND = 'AND',
  OR = 'OR',
  LIKE = 'LIKE',
  JOIN = 'JOIN',
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  ON = 'ON',
  ORDER = 'ORDER',
  BY = 'BY',
  ASC = 'ASC',
  DESC = 'DESC',
  LIMIT = 'LIMIT',
  IF = 'IF',
  EXISTS = 'EXISTS',
  SHOW = 'SHOW',
  TABLES = 'TABLES',
  DESCRIBE = 'DESCRIBE',

  INTEGER = 'INTEGER',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  REAL = 'REAL',
  DATE = 'DATE',

  STRING = 'STRING',
  NUMBER = 'NUMBER',
  TRUE = 'TRUE',
  FALSE = 'FALSE',

  IDENTIFIER = 'IDENTIFIER',

  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',

  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  ASTERISK = 'ASTERISK',
  DOT = 'DOT',

  EOF = 'EOF',
}

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

const KEYWORDS: Record<string, TokenType> = {
  BEGIN: TokenType.BEGIN,
  COMMIT: TokenType.COMMIT,
  ROLLBACK: TokenType.ROLLBACK,
  ADD: TokenType.ADD,
  COLUMN: TokenType.COLUMN,
  RENAME: TokenType.RENAME,
  TO: TokenType.TO,
  MODIFY: TokenType.MODIFY,
  SELECT: TokenType.SELECT,
  FROM: TokenType.FROM,
  WHERE: TokenType.WHERE,
  INSERT: TokenType.INSERT,
  INTO: TokenType.INTO,
  VALUES: TokenType.VALUES,
  UPDATE: TokenType.UPDATE,
  DELETE: TokenType.DELETE,
  SET: TokenType.SET,
  CREATE: TokenType.CREATE,
  TABLE: TokenType.TABLE,
  DROP: TokenType.DROP,
  ALTER: TokenType.ALTER,
  PRIMARY: TokenType.PRIMARY,
  KEY: TokenType.KEY,
  UNIQUE: TokenType.UNIQUE,
  NOT: TokenType.NOT,
  NULL: TokenType.NULL,
  AUTO_INCREMENT: TokenType.AUTO_INCREMENT,
  DEFAULT: TokenType.DEFAULT,
  AND: TokenType.AND,
  OR: TokenType.OR,
  LIKE: TokenType.LIKE,
  JOIN: TokenType.JOIN,
  INNER: TokenType.INNER,
  LEFT: TokenType.LEFT,
  RIGHT: TokenType.RIGHT,
  ON: TokenType.ON,
  ORDER: TokenType.ORDER,
  BY: TokenType.BY,
  ASC: TokenType.ASC,
  DESC: TokenType.DESC,
  LIMIT: TokenType.LIMIT,
  IF: TokenType.IF,
  EXISTS: TokenType.EXISTS,
  SHOW: TokenType.SHOW,
  TABLES: TokenType.TABLES,
  DESCRIBE: TokenType.DESCRIBE,
  INTEGER: TokenType.INTEGER,
  TEXT: TokenType.TEXT,
  BOOLEAN: TokenType.BOOLEAN,
  REAL: TokenType.REAL,
  DATE: TokenType.DATE,
  TRUE: TokenType.TRUE,
  FALSE: TokenType.FALSE,
};

export class Tokenizer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = input.length > 0 ? (input[0] ?? null) : null;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      if (this.isWhitespace(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      if (this.currentChar === '-' && this.peek() === '-') {
        this.skipComment();
        continue;
      }

      if (this.currentChar === "'" || this.currentChar === '"') {
        tokens.push(this.readString());
        continue;
      }

      if (this.isDigit(this.currentChar)) {
        tokens.push(this.readNumber());
        continue;
      }

      if (this.isAlpha(this.currentChar)) {
        tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      const operator = this.readOperator();
      if (operator) {
        tokens.push(operator);
        continue;
      }

      this.advance();
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      position: this.position,
    });

    return tokens;
  }

  private advance(): void {
    this.position++;
    this.currentChar =
      this.position < this.input.length
        ? (this.input[this.position] ?? null)
        : null;
  }

  private peek(offset: number = 1): string | null {
    const peekPos = this.position + offset;
    return peekPos < this.input.length ? (this.input[peekPos] ?? null) : null;
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && this.isWhitespace(this.currentChar)) {
      this.advance();
    }
  }

  private skipComment(): void {
    while (this.currentChar !== null && this.currentChar !== '\n') {
      this.advance();
    }
    if (this.currentChar === '\n') {
      this.advance();
    }
  }

  private readString(): Token {
    const startPos = this.position;
    const quote = this.currentChar;
    this.advance();

    let value = '';
    while (this.currentChar !== null && this.currentChar !== quote) {
      if (this.currentChar === '\\' && this.peek() === quote) {
        this.advance();
        value += quote;
        this.advance();
      } else {
        value += this.currentChar;
        this.advance();
      }
    }

    this.advance();

    return {
      type: TokenType.STRING,
      value,
      position: startPos,
    };
  }

  private readNumber(): Token {
    const startPos = this.position;
    let value = '';

    while (this.currentChar !== null && this.isDigit(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }

    if (this.currentChar === '.' && this.peek() && this.isDigit(this.peek()!)) {
      value += this.currentChar;
      this.advance();

      while (this.currentChar !== null && this.isDigit(this.currentChar)) {
        value += this.currentChar;
        this.advance();
      }
    }

    return {
      type: TokenType.NUMBER,
      value,
      position: startPos,
    };
  }

  private readIdentifierOrKeyword(): Token {
    const startPos = this.position;
    let value = '';

    while (
      this.currentChar !== null &&
      (this.isAlphaNumeric(this.currentChar) || this.currentChar === '_')
    ) {
      value += this.currentChar;
      this.advance();
    }

    const upperValue = value.toUpperCase();
    const tokenType = KEYWORDS[upperValue] || TokenType.IDENTIFIER;

    return {
      type: tokenType,
      value: tokenType === TokenType.IDENTIFIER ? value : upperValue,
      position: startPos,
    };
  }

  private readOperator(): Token | null {
    const startPos = this.position;
    const char = this.currentChar;

    if (!char) return null;

    if (char === '!' && this.peek() === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.NOT_EQUALS, value: '!=', position: startPos };
    }

    if (char === '>' && this.peek() === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.GREATER_EQUAL, value: '>=', position: startPos };
    }

    if (char === '<' && this.peek() === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.LESS_EQUAL, value: '<=', position: startPos };
    }

    const singleCharTokens: Record<string, TokenType> = {
      '=': TokenType.EQUALS,
      '>': TokenType.GREATER_THAN,
      '<': TokenType.LESS_THAN,
      ',': TokenType.COMMA,
      ';': TokenType.SEMICOLON,
      '(': TokenType.LEFT_PAREN,
      ')': TokenType.RIGHT_PAREN,
      '*': TokenType.ASTERISK,
      '.': TokenType.DOT,
    };

    const tokenType = singleCharTokens[char];
    if (tokenType) {
      this.advance();
      return { type: tokenType, value: char, position: startPos };
    }

    return null;
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }
}
