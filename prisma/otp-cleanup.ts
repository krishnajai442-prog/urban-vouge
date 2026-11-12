// prisma/otp-cleanup.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  const now = Date.now();

  const expired = await prisma.otpCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(now - 24 * 60 * 60 * 1000),
      },
    },
  });

  const consumed = await prisma.otpCode.deleteMany({
    where: {
      consumedAt: {
        lt: new Date(now - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(
    `OTP cleanup: expired=${expired.count}, consumed=${consumed.count}`,
  );

  await prisma.$disconnect();
})();