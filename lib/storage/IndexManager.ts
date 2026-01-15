import { Index, ColumnValue, ConstraintViolation } from '@/lib/types';

export class IndexManager {
  static createIndex(columnName: string, unique: boolean): Index {
    return {
      columnName,
      unique,
      entries: new Map(),
    };
  }

  static addEntry(
    index: Index,
    value: ColumnValue,
    rowIndex: number
  ): ConstraintViolation | null {
    const normalizedValue = this.normalizeValue(value);

    const existingIndices = index.entries.get(normalizedValue);

    if (index.unique && existingIndices && existingIndices.size > 0) {
      return {
        type: 'UNIQUE',
        column: index.columnName,
        value,
        message: `Unique constraint violation: value '${value}' already exists in column '${index.columnName}'`,
      };
    }

    // Add to index
    if (existingIndices) {
      existingIndices.add(rowIndex);
    } else {
      index.entries.set(normalizedValue, new Set([rowIndex]));
    }

    return null;
  }

  static removeEntry(index: Index, value: ColumnValue, rowIndex: number): void {
    const normalizedValue = this.normalizeValue(value);
    const indices = index.entries.get(normalizedValue);

    if (indices) {
      indices.delete(rowIndex);
      if (indices.size === 0) {
        index.entries.delete(normalizedValue);
      }
    }
  }

  static updateEntry(
    index: Index,
    oldValue: ColumnValue,
    newValue: ColumnValue,
    rowIndex: number
  ): ConstraintViolation | null {
    // Remove old entry
    this.removeEntry(index, oldValue, rowIndex);

    // Add new entry
    return this.addEntry(index, newValue, rowIndex);
  }

  static lookup(index: Index, value: ColumnValue): Set<number> {
    const normalizedValue = this.normalizeValue(value);
    return index.entries.get(normalizedValue) || new Set();
  }

  static exists(index: Index, value: ColumnValue): boolean {
    const normalizedValue = this.normalizeValue(value);
    const indices = index.entries.get(normalizedValue);
    return indices !== undefined && indices.size > 0;
  }

  static getAllValues(index: Index): ColumnValue[] {
    return Array.from(index.entries.keys());
  }

  static getSize(index: Index): number {
    let total = 0;
    for (const indices of index.entries.values()) {
      total += indices.size;
    }
    return total;
  }

  static clear(index: Index): void {
    index.entries.clear();
  }

  static rebuild(
    index: Index,
    values: Array<{ value: ColumnValue; rowIndex: number }>
  ): ConstraintViolation | null {
    // Clear existing entries
    this.clear(index);

    // Re-add all values
    for (const { value, rowIndex } of values) {
      const violation = this.addEntry(index, value, rowIndex);
      if (violation) {
        return violation;
      }
    }

    return null;
  }

  static rangeQuery(
    index: Index,
    operator: '>' | '<' | '>=' | '<=',
    value: ColumnValue
  ): Set<number> {
    const result = new Set<number>();

    if (typeof value !== 'number' && !(value instanceof Date)) {
      return result;
    }

    const compareValue = value instanceof Date ? value.getTime() : value;

    for (const [indexedValue, rowIndices] of index.entries) {
      if (indexedValue === null) continue;

      let indexedCompareValue: number;
      if (indexedValue instanceof Date) {
        indexedCompareValue = indexedValue.getTime();
      } else if (typeof indexedValue === 'number') {
        indexedCompareValue = indexedValue;
      } else {
        continue;
      }

      let matches = false;
      switch (operator) {
        case '>':
          matches = indexedCompareValue > compareValue;
          break;
        case '<':
          matches = indexedCompareValue < compareValue;
          break;
        case '>=':
          matches = indexedCompareValue >= compareValue;
          break;
        case '<=':
          matches = indexedCompareValue <= compareValue;
          break;
      }

      if (matches) {
        for (const rowIndex of rowIndices) {
          result.add(rowIndex);
        }
      }
    }

    return result;
  }

  static likeQuery(index: Index, pattern: string): Set<number> {
    const result = new Set<number>();

    // Convert SQL LIKE pattern to regex
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/%/g, '.*') // % matches any sequence
      .replace(/_/g, '.'); // _ matches single char

    const regex = new RegExp(`^${regexPattern}$`, 'i');

    for (const [indexedValue, rowIndices] of index.entries) {
      if (typeof indexedValue === 'string' && regex.test(indexedValue)) {
        for (const rowIndex of rowIndices) {
          result.add(rowIndex);
        }
      }
    }

    return result;
  }

  private static normalizeValue(value: ColumnValue): ColumnValue {
    if (value === null || value === undefined) {
      return null;
    }

    // Case-insensitive string indexing
    if (typeof value === 'string') {
      return value.toLowerCase();
    }

    return value;
  }
}
