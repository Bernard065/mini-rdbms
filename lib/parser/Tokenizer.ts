// Token types for SQL lexical analysis
export enum TokenType {
  // Keywords
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
  SHOW = 'SHOW',
  TABLES = 'TABLES',
  DESCRIBE = 'DESCRIBE',

  // Data types
  INTEGER = 'INTEGER',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  REAL = 'REAL',
  DATE = 'DATE',

  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  TRUE = 'TRUE',
  FALSE = 'FALSE',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Operators
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',

  // Punctuation
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  ASTERISK = 'ASTERISK',
  DOT = 'DOT',

  // Special
  EOF = 'EOF',
}

// Token representation
export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

// Mapping of keywords to token types
const KEYWORDS: Record<string, TokenType> = {
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

// Tokenizer class for SQL input
export class Tokenizer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = input.length > 0 ? (input[0] ?? null) : null;
  }

  // Main method to tokenize the input
  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      // Skip whitespace
      if (this.isWhitespace(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // Skip comments
      if (this.currentChar === '-' && this.peek() === '-') {
        this.skipComment();
        continue;
      }

      // String literals
      if (this.currentChar === "'" || this.currentChar === '"') {
        tokens.push(this.readString());
        continue;
      }

      // Numbers
      if (this.isDigit(this.currentChar)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Identifiers and keywords
      if (this.isAlpha(this.currentChar)) {
        tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      // Operators and punctuation
      const operator = this.readOperator();
      if (operator) {
        tokens.push(operator);
        continue;
      }

      // Unknown character - skip it
      this.advance();
    }

    // Add EOF token
    tokens.push({
      type: TokenType.EOF,
      value: '',
      position: this.position,
    });

    return tokens;
  }

  // Advances the current position and updates currentChar
  private advance(): void {
    this.position++;
    this.currentChar =
      this.position < this.input.length
        ? (this.input[this.position] ?? null)
        : null;
  }

  // Peeks at the next character without advancing
  private peek(offset: number = 1): string | null {
    const peekPos = this.position + offset;
    return peekPos < this.input.length ? (this.input[peekPos] ?? null) : null;
  }

  // Skips whitespace characters
  private skipWhitespace(): void {
    while (this.currentChar !== null && this.isWhitespace(this.currentChar)) {
      this.advance();
    }
  }

  // Skips single-line comments
  private skipComment(): void {
    while (this.currentChar !== null && this.currentChar !== '\n') {
      this.advance();
    }
    if (this.currentChar === '\n') {
      this.advance();
    }
  }

  // Reads a string literal
  private readString(): Token {
    const startPos = this.position;
    const quote = this.currentChar;
    this.advance();

    let value = '';
    while (this.currentChar !== null && this.currentChar !== quote) {
      // Handle escaped quotes
      if (this.currentChar === '\\' && this.peek() === quote) {
        this.advance();
        value += quote;
        this.advance();
      } else {
        value += this.currentChar;
        this.advance();
      }
    }

    this.advance(); // Skip closing quote

    return {
      type: TokenType.STRING,
      value,
      position: startPos,
    };
  }

  // Reads a number (integer or real)
  private readNumber(): Token {
    const startPos = this.position;
    let value = '';

    while (this.currentChar !== null && this.isDigit(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }

    // Check for decimal point
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

  // Reads an identifier or keyword
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

  // Reads operators and punctuation
  private readOperator(): Token | null {
    const startPos = this.position;
    const char = this.currentChar;

    if (!char) return null;

    // Two-character operators
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

    // Single-character operators
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

  // Helper: checks if character is whitespace
  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  // Helper: checks if character is a digit
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  // Helper: checks if character is alphabetic
  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  // Helper: checks if character is alphanumeric
  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }
}
