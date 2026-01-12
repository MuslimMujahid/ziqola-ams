import { Controller, Get, Query } from "@nestjs/common";
import { AppService } from "./app.service";
import {
  successResponse,
  PaginationQueryDto,
  paginatedResponse,
} from "./common";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    // Option 1: Return raw data (will be auto-wrapped by interceptor)
    return this.appService.getHello();
  }

  @Get("example/basic")
  getBasicExample() {
    // Option 2: Use helper function for explicit control
    return successResponse(
      { message: "This is a basic response example" },
      "Basic response retrieved successfully",
      200
    );
  }

  @Get("example/array")
  getArrayExample(@Query() query: PaginationQueryDto) {
    // Example of paginated response
    const data = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
    ];

    // Pass the query object directly to paginatedResponse
    return paginatedResponse(
      data,
      query,
      "Array response retrieved successfully",
      200
    );
  }
}
