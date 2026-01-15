import { DataType, ColumnValue, ConstraintViolation } from '@/lib/types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly value: ColumnValue;
  readonly error?: ConstraintViolation;
}

export class TypeValidator {
  
  static validate(
    value: unknown,
    expectedType: DataType,
    columnName: string,
    allowNull: boolean = true
  ): ValidationResult {
    if (value === null || value === undefined) {
      if (allowNull) {
        return { valid: true, value: null };
      }
      return {
        valid: false,
        value: null,
        error: {
          type: 'NOT_NULL',
          column: columnName,
          value: null,
          message: `Column '${columnName}' cannot be NULL`,
        },
      };
    }

    // Validate based on data type
    switch (expectedType) {
      case DataType.INTEGER:
        return this.validateInteger(value, columnName);
      case DataType.TEXT:
        return this.validateText(value, columnName);
      case DataType.BOOLEAN:
        return this.validateBoolean(value, columnName);
      case DataType.REAL:
        return this.validateReal(value, columnName);
      case DataType.DATE:
        return this.validateDate(value, columnName);
      default:
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value as ColumnValue,
            message: `Unknown data type for column '${columnName}'`,
          },
        };
    }
  }

  private static validateInteger(
    value: unknown,
    columnName: string
  ): ValidationResult {
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value,
            message: `Value '${value}' is not an integer for column '${columnName}'`,
          },
        };
      }
      return { valid: true, value };
    }

    // Try to convert string to integer
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed) || parsed.toString() !== value) {
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value,
            message: `Cannot convert '${value}' to INTEGER for column '${columnName}'`,
          },
        };
      }
      return { valid: true, value: parsed };
    }

    return {
      valid: false,
      value: null,
      error: {
        type: 'TYPE_MISMATCH',
        column: columnName,
        value: value as ColumnValue,
        message: `Expected INTEGER for column '${columnName}', got ${typeof value}`,
      },
    };
  }

  private static validateText(
    value: unknown,
    columnName: string
  ): ValidationResult {
    if (typeof value === 'string') {
      return { valid: true, value };
    }

    // Convert to string if possible
    if (typeof value === 'number' || typeof value === 'boolean') {
      return { valid: true, value: String(value) };
    }

    return {
      valid: false,
      value: null,
      error: {
        type: 'TYPE_MISMATCH',
        column: columnName,
        value: value as ColumnValue,
        message: `Cannot convert to TEXT for column '${columnName}'`,
      },
    };
  }

  private static validateBoolean(
    value: unknown,
    columnName: string
  ): ValidationResult {
    if (typeof value === 'boolean') {
      return { valid: true, value };
    }

    // Convert string to boolean
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        return { valid: true, value: true };
      }
      if (lower === 'false' || lower === '0' || lower === 'no') {
        return { valid: true, value: false };
      }
    }

    // Convert number to boolean
    if (typeof value === 'number') {
      return { valid: true, value: value !== 0 };
    }

    return {
      valid: false,
      value: null,
      error: {
        type: 'TYPE_MISMATCH',
        column: columnName,
        value: value as ColumnValue,
        message: `Cannot convert to BOOLEAN for column '${columnName}'`,
      },
    };
  }

  private static validateReal(
    value: unknown,
    columnName: string
  ): ValidationResult {
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value,
            message: `Value must be a finite number for column '${columnName}'`,
          },
        };
      }
      return { valid: true, value };
    }

    // Try to convert string to float
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value,
            message: `Cannot convert '${value}' to REAL for column '${columnName}'`,
          },
        };
      }
      return { valid: true, value: parsed };
    }

    return {
      valid: false,
      value: null,
      error: {
        type: 'TYPE_MISMATCH',
        column: columnName,
        value: value as ColumnValue,
        message: `Expected REAL for column '${columnName}', got ${typeof value}`,
      },
    };
  }

  private static validateDate(
    value: unknown,
    columnName: string
  ): ValidationResult {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value,
            message: `Invalid date for column '${columnName}'`,
          },
        };
      }
      return { valid: true, value };
    }

    // Try to parse string as date
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          valid: false,
          value: null,
          error: {
            type: 'TYPE_MISMATCH',
            column: columnName,
            value: value as ColumnValue,
            message: `Cannot convert '${value}' to DATE for column '${columnName}'`,
          },
        };
      }
      return { valid: true, value: date };
    }

    return {
      valid: false,
      value: null,
      error: {
        type: 'TYPE_MISMATCH',
        column: columnName,
        value: value as ColumnValue,
        message: `Expected DATE for column '${columnName}', got ${typeof value}`,
      },
    };
  }
}
