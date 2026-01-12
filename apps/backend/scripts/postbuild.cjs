const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "..", "dist", "generated", "prisma");
const pkgPath = path.join(targetDir, "package.json");

try {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(
    pkgPath,
    JSON.stringify(
      { name: "backend-generated-prisma", type: "commonjs" },
      null,
      2
    ),
    "utf8"
  );
  console.log("Wrote", pkgPath);
} catch (err) {
  console.error(
    "Failed to write CommonJS package.json for Prisma client:",
    err
  );
  process.exitCode = 0; // do not fail build
}
