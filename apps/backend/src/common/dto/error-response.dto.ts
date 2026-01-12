/**
 * Standard error response DTO
 */
export class ErrorResponseDto {
  statusCode: number;
  message: string;
  error: string;

  constructor(statusCode: number, message: string, error: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
  }
}
