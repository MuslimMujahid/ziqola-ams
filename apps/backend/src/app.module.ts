import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RbacModule } from "./common/rbac/rbac.module";
import { ExamplesModule } from "./examples/examples.module";
import { TenantsModule } from "./tenants/tenants.module";
import { ProfilesModule } from "./profiles/profiles.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RbacModule, // Global RBAC guards
    AuthModule,
    UsersModule,
    TenantsModule,
    ProfilesModule,
    ExamplesModule, // Example controller for RBAC patterns
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
