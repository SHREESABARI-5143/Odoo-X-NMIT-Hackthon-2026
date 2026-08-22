import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Request body validation middleware factory using Zod.
 * Validates req.body against the provided schema.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          message: 'Validation failed.',
          details,
        });
        return;
      }
      next(error);
    }
  };
}
