import { Response } from 'express';

interface ApiResponseData {
  success: boolean;
  message: string;
  data?: unknown;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendSuccess(res: Response, data: unknown, message: string = 'Success', statusCode: number = 200) {
  const response: ApiResponseData = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendPaginated(
  res: Response,
  data: unknown,
  meta: { page: number; limit: number; total: number },
  message: string = 'Success'
) {
  const response: ApiResponseData = {
    success: true,
    message,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  };
  return res.status(200).json(response);
}

export function sendError(res: Response, statusCode: number, message: string, details?: unknown) {
  const response: ApiResponseData & { details?: unknown } = {
    success: false,
    message,
  };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
}
