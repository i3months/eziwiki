import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { payloadSchema } from './schema';

/**
 * Result of payload validation
 */
export interface ValidationResult {
  /** Whether the payload is valid */
  valid: boolean;
  /** Array of error messages if validation failed */
  errors?: string[];
}

/**
 * Validates payload configuration against JSON Schema
 *
 * This function ensures that the user-provided payload matches the required
 * structure for the landing page generator. It validates:
 * - Required fields (global.title, global.description, navigation)
 * - Data types and formats (URLs, hex colors)
 * - Navigation structure and nesting
 * - Theme color values
 *
 * @param payload - User-provided payload object to validate
 * @returns Validation result with detailed error messages if invalid
 *
 * @example
 * ```typescript
 * import { validatePayload } from './lib/payload/validator';
 * import payload from './payload/config';
 *
 * const result = validatePayload(payload);
 * if (!result.valid) {
 *   console.error('Payload validation failed:');
 *   result.errors?.forEach(err => console.error(`  - ${err}`));
 *   process.exit(1);
 * }
 * ```
 */
export function validatePayload(payload: unknown): ValidationResult {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const validate = ajv.compile(payloadSchema);
  const valid = validate(payload);

  if (!valid && validate.errors) {
    return {
      valid: false,
      // `theme.primary`, as the author wrote it, rather than ajv's
      // `/theme/primary`. An unknown key names the key.
      errors: validate.errors.map((err) => {
        const at = err.instancePath.split('/').filter(Boolean);
        if (err.keyword === 'additionalProperties') {
          at.push(String((err.params as { additionalProperty: string }).additionalProperty));
          return `${at.join('.')} is not a setting`;
        }
        return `${at.join('.') || 'config'} ${err.message}`;
      }),
    };
  }

  return { valid: true };
}
