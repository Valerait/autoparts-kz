import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden') {
  return error(message, 403);
}

export function notFound(message = 'Not found') {
  return error(message, 404);
}

export function validationError(err: ZodError) {
  const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return NextResponse.json(
    { success: false, error: 'Validation error', details: messages },
    { status: 422 }
  );
}

export function handleApiError(err: unknown) {
  console.error('API Error:', err);

  if (err instanceof ZodError) {
    return validationError(err);
  }

  if (err instanceof Error) {
    if (err.message === 'Unauthorized') return unauthorized();
    if (err.message === 'Forbidden') return forbidden();
    return error(err.message, 500);
  }

  return error('Internal server error', 500);
}
