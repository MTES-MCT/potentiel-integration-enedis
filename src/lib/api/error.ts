export class ApiError extends Error {
  constructor(public type: string) {
    super();
  }
}
