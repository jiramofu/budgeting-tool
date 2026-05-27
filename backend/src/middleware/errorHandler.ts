import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.error('Error:', {
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    details: isDevelopment ? err.details : undefined,
  });

  res.status(statusCode).json({
    error: err.message,
    ...(isDevelopment && { details: err.details, stack: err.stack }),
  });
};
