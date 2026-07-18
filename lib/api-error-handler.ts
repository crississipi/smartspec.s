import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown, context: string = 'Unknown operation') {
  console.error(`[API Error - ${context}]`, error);

  if (error instanceof APIError) {
    return NextResponse.json(
      { success: false, message: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { success: false, message: 'Invalid request format', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

export function validateRequest<T>(data: any, schema: (data: any) => T): T | null {
  try {
    return schema(data);
  } catch (error) {
    return null;
  }
}

export function requireAuth(session: any) {
  if (!session || !session.user?.id) {
    throw new APIError(401, 'Unauthorized', 'NO_SESSION');
  }
  return session;
}

export function requireParam(params: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (!params[key]) {
      throw new APIError(400, `Missing required parameter: ${key}`, 'MISSING_PARAM');
    }
  }
}
