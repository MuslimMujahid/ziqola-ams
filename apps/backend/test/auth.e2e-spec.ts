import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { prisma } from "@repo/db";

describe("Auth E2E (conditional)", () => {
  let app: INestApplication;

  const hasDb = !!process.env.DATABASE_URL;
  const maybe = hasDb ? it : it.skip;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const tenantId = "00000000-0000-0000-0000-000000000001";
  const email = `e2e_${Date.now()}@example.com`;
  const password = "Secret123!";

  maybe("register, login, and get me", async () => {
    // Ensure tenant exists
    await prisma.tenant.upsert({
      where: { id: tenantId },
      create: { id: tenantId, name: "E2E Tenant", slug: "e2e-tenant" },
      update: {},
    });

    // Register
    const reg = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ tenantId, email, password, name: "E2E", role: "ADMIN_STAFF" })
      .expect(201);

    expect(reg.body).toHaveProperty("accessToken");

    // Login
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password, role: "ADMIN_STAFF" })
      .expect(200);

    const token = login.body.accessToken as string;
    expect(token).toBeTruthy();

    // Me
    const me = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(me.body.user).toMatchObject({ email, tenantId });
  });
});
