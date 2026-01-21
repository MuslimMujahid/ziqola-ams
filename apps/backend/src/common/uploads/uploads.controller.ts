import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { successResponse, User } from "../";
import { UploadsService } from "./uploads.service";
import { UploadFilesDto } from "./dto/upload-file.dto";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async generateUploadUrls(
    @User() user: { tenantId: string },
    @Body() dto: UploadFilesDto,
  ) {
    // Generic upload endpoint - no specific context required
    // Context will be provided when creating DB records later
    const results = await this.uploadsService.generateUploadUrls(
      user.tenantId,
      dto.files,
      { module: "uploads", entityId: undefined },
    );

    return successResponse(results, "Upload URLs generated successfully");
  }
}
