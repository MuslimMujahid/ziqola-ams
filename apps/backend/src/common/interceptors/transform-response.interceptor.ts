import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SuccessResponseDto } from "../dto/success-response.dto";

/**
 * Interceptor to transform all successful responses to the standard format
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<SuccessResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // If the response is already in the standard format, return it
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          "statusCode" in data &&
          "message" in data
        ) {
          return data;
        }

        // Otherwise, wrap it in the standard format
        return new SuccessResponseDto(data, "Success", statusCode);
      })
    );
  }
}
