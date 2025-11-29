export class UnauthorizedError extends Error {
  statusCode = 401;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
