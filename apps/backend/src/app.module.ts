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
import { AcademicModule } from "./academic/academic.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { GroupsModule } from "./groups/groups.module";
import { ClassesModule } from "./classes/classes.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { ClassSubjectsModule } from "./class-subjects/class-subjects.module";
import { SchedulesModule } from "./schedules/schedules.module";
import { SessionsModule } from "./sessions/sessions.module";
import { UploadsModule } from "./common/uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 60,
        },
      ],
    }),
    PrismaModule,
    RbacModule, // Global RBAC guards
    AuthModule,
    UsersModule,
    TenantsModule,
    ProfilesModule,
    AcademicModule,
    GroupsModule,
    ClassesModule,
    SubjectsModule,
    ClassSubjectsModule,
    SchedulesModule,
    SessionsModule,
    EnrollmentsModule,
    UploadsModule,
    ExamplesModule, // Example controller for RBAC patterns
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
