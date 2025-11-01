import { HttpException } from "./http-exception.utils";

export class BadRequestException extends HttpException {
  constructor(message: string, details?: object) {
    super(message, 400, details);
  }
}
export class UnauthorizedException extends HttpException {
  constructor(message: string, details?: object) {
    super(message, 401, details);
  }
}
export class NotFoundException extends HttpException {
  constructor(message: string, details?: object) {
    super(message, 404, details);
  }
}
export class ConflictException extends HttpException {
  constructor(message: string, details?: object) {
    super(message, 409, details);
  }
}
