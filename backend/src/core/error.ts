export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BadRequest';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFound';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'Unauthorized';
  }
}
