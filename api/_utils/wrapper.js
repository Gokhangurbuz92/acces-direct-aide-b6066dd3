import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import SentryClient from './sentry.js';
import { AppError, errorCodes } from './errors.js';
import crypto from 'crypto';

export function createHandler(handler, schemas = {}) {
  return async (req, res) => {
    // Generate Request ID
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    // Add requestId to Sentry Scope (Sentry v8+ uses setTag directly)
    if (SentryClient.setTag) {
      SentryClient.setTag("request_id", requestId);
    }

    try {
      // Validation
      let validatedQuery = req.query;
      let validatedBody = req.body;

      if (schemas.query) {
        // Zod parse returns the transformed data
        validatedQuery = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        validatedBody = schemas.body.parse(req.body);
      }

      // Attach validated data to req
      req.validated = {
        query: validatedQuery,
        body: validatedBody
      };

      // Execute Handler
      const result = await handler(req, res);

      // If handler manually sent response, stop here.
      if (res.headersSent) return;

      // Default Response Structure
      const response = {
        data: result,
        meta: {
          requestId,
        },
        error: null
      };

      // Handle Pagination (Convention: result has { items, pagination })
      if (result && typeof result === 'object' && 'items' in result && 'pagination' in result) {
        response.data = result.items;
        response.meta.pagination = result.pagination;
      }

      return res.status(200).json(response);

    } catch (err) {
      console.error(`[${requestId}] Error:`, err);

      let statusCode = 500;
      let errorResponse = {
        code: errorCodes.INTERNAL_ERROR,
        message: "Une erreur interne est survenue.",
        details: null
      };

      // 1. AppError
      if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorResponse = {
          code: err.code,
          message: err.message,
          details: err.details
        };
      }
      // 2. Zod Error
      else if (err instanceof ZodError) {
        statusCode = 400;
        errorResponse = {
          code: errorCodes.VALIDATION_ERROR,
          message: "Données invalides.",
          details: err.errors
        };
      }
      // 3. Prisma Error
      else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique constraint failed
        // P2025: Record not found
        if (err.code === 'P2002') {
          statusCode = 409;
          errorResponse.code = errorCodes.CONFLICT;
          errorResponse.message = "Ressource déjà existante.";
        } else if (err.code === 'P2025') {
          statusCode = 404;
          errorResponse.code = errorCodes.NOT_FOUND;
          errorResponse.message = "Ressource non trouvée.";
        } else {
             // Other Prisma errors
             if (process.env.VERCEL_ENV !== 'production') {
                 errorResponse.details = err.code;
             }
        }
      }
      // 4. Fallback
      else {
         // Report to Sentry
         SentryClient.captureException(err);
         if (process.env.VERCEL_ENV !== 'production') {
             errorResponse.details = err.message;
         }
      }

      return res.status(statusCode).json({
        data: null,
        meta: { requestId },
        error: errorResponse
      });
    }
  };
}
