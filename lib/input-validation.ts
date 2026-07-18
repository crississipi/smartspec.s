/**
 * Input validation utilities for sanitizing and validating user input
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

export const validators = {
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  password: (value: string): boolean => {
    return typeof value === 'string' && value.length >= 8;
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  number: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value);
  },

  positiveNumber: (value: any): boolean => {
    return validators.number(value) && value > 0;
  },

  string: (value: any, minLength: number = 1, maxLength: number = 10000): boolean => {
    return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
  },

  enum: (value: any, allowedValues: any[]): boolean => {
    return allowedValues.includes(value);
  },

  budget: (value: any): boolean => {
    return validators.positiveNumber(value) && value >= 10000 && value <= 10000000;
  },

  useCase: (value: any): boolean => {
    return validators.enum(value, ['gaming', 'professional', 'productivity', 'streaming', 'general']);
  },
};

export const sanitizers = {
  string: (value: any): string => {
    return String(value || '').trim().substring(0, 10000);
  },

  number: (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },

  email: (value: any): string => {
    return String(value || '').trim().toLowerCase();
  },

  url: (value: any): string => {
    const url = String(value || '').trim();
    try {
      return new URL(url).toString();
    } catch {
      return '';
    }
  },
};

export function validate(
  data: Record<string, any>,
  schema: Record<string, (value: any) => boolean>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    if (!validator(data[field])) {
      errors.push({
        field,
        message: `Invalid value for field: ${field}`,
      });
    }
  }

  return errors;
}

export function validateAndSanitize(
  data: Record<string, any>,
  rules: Record<
    string,
    {
      validator?: (value: any) => boolean;
      sanitizer?: (value: any) => any;
      required?: boolean;
    }
  >
): { data: Record<string, any>; errors: ValidationError[] } {
  const sanitized: Record<string, any> = {};
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      continue;
    }

    // Skip if not required and not provided
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Validate
    if (rule.validator && !rule.validator(value)) {
      errors.push({
        field,
        message: `Invalid value for field: ${field}`,
      });
      continue;
    }

    // Sanitize
    if (rule.sanitizer) {
      sanitized[field] = rule.sanitizer(value);
    } else {
      sanitized[field] = value;
    }
  }

  return { data: sanitized, errors };
}
