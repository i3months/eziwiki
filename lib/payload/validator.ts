import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { payloadSchema } from './schema';

/**
 * Validates payload against JSON Schema
 * @param payload - User-provided payload object
 * @returns Validation result with errors if invalid
 */
export function validatePayload(payload: unknown): {
  valid: boolean;
  errors?: string[];
} {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const validate = ajv.compile(payloadSchema);
  const valid = validate(payload);

  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map((err) => `${err.instancePath || 'root'} ${err.message}`),
    };
  }

  return { valid: true };
}
