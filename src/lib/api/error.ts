export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }

  static match(error: unknown, expectedStatus: number, expectedText: RegExp) {
    return (
      error instanceof ApiError && error.match(expectedStatus, expectedText)
    );
  }

  match(expectedStatus: number, expectedText: RegExp) {
    return this.status === expectedStatus && expectedText.test(this.message);
  }
}
