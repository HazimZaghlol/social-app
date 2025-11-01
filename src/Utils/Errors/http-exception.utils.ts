export class HttpException extends Error {
  constructor(public message: string, public statusCode: number, public details?: object) {
    super();
  }
}
