// Thrown by the data-access helpers when a record either doesn't exist or
// doesn't belong to the requesting user. Callers map this to a 404 so we never
// leak whether an id exists under another account.
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
