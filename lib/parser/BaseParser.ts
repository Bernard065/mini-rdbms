import { Token, TokenType, Tokenizer } from './Tokenizer';
import { DatabaseError } from '@/lib/types';

// BaseParser class for parsing SQL tokens
export class BaseParser {
  protected tokens: Token[];
  protected position: number;
  protected currentToken: Token;

  constructor(input: string) {
    const tokenizer = new Tokenizer(input);
    this.tokens = tokenizer.tokenize();
    this.position = 0;
    this.currentToken = this.tokens[0] ?? this.createEOFToken();
  }

  // Advances to the next token
  protected advance(): void {
    this.position++;
    this.currentToken = this.tokens[this.position] ?? this.createEOFToken();
  }

  // Peeks at the next token without consuming it
  protected peek(offset: number = 1): Token {
    const peekPos = this.position + offset;
    return this.tokens[peekPos] ?? this.createEOFToken();
  }

  // Checks if the current token matches any of the given types
  protected match(...types: TokenType[]): boolean {
    return types.includes(this.currentToken.type);
  }

  // Consumes a token of the expected type
  protected consume(type: TokenType, errorMessage?: string): Token {
    if (this.currentToken.type !== type) {
      throw this.createSyntaxError(
        errorMessage || `Expected ${type}, got ${this.currentToken.type}`
      );
    }
    const token = this.currentToken;
    this.advance();
    return token;
  }

  // Consumes a token and returns its value
  protected consumeValue(type: TokenType, errorMessage?: string): string {
    return this.consume(type, errorMessage).value;
  }

  // Checks if the parser has reached the end of input
  protected isAtEnd(): boolean {
    return this.currentToken.type === TokenType.EOF;
  }

  // Creates a syntax error
  protected createSyntaxError(message: string): DatabaseError {
    return {
      type: 'SYNTAX_ERROR',
      message: `${message} at position ${this.currentToken.position}`,
    };
  }

  // Parses a comma-separated list of items
  protected parseCommaSeparatedList<T>(
    parseItem: () => T,
    terminator: TokenType = TokenType.RIGHT_PAREN
  ): T[] {
    const items: T[] = [];

    if (this.currentToken.type === terminator) {
      return items;
    }

    items.push(parseItem());

    while (this.match(TokenType.COMMA)) {
      this.advance();
      items.push(parseItem());
    }

    return items;
  }

  // Parses an identifier
  protected parseIdentifier(): string {
    return this.consumeValue(TokenType.IDENTIFIER, 'Expected identifier');
  }

  // Parses a qualified identifier
  protected parseQualifiedIdentifier(): { table?: string; column: string } {
    const first = this.parseIdentifier();

    if (this.match(TokenType.DOT)) {
      this.advance();
      const column = this.parseIdentifier();
      return { table: first, column };
    }

    return { column: first };
  }

  // Parses a literal value
  protected parseLiteral(): string | number | boolean | null {
    if (this.match(TokenType.STRING)) {
      const value = this.currentToken.value;
      this.advance();
      return value;
    }

    if (this.match(TokenType.NUMBER)) {
      const value = parseFloat(this.currentToken.value);
      this.advance();
      return value;
    }

    if (this.match(TokenType.TRUE)) {
      this.advance();
      return true;
    }

    if (this.match(TokenType.FALSE)) {
      this.advance();
      return false;
    }

    if (this.match(TokenType.NULL)) {
      this.advance();
      return null;
    }

    throw this.createSyntaxError('Expected literal value');
  }

  // Skips an optional semicolon
  protected skipOptionalSemicolon(): void {
    if (this.match(TokenType.SEMICOLON)) {
      this.advance();
    }
  }

  // Creates an EOF token
  private createEOFToken(): Token {
    return {
      type: TokenType.EOF,
      value: '',
      position: this.position,
    };
  }
}
