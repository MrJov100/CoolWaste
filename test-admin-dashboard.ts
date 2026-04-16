import { PrismaClient, Role } from '@prisma/client';
import { getDashboardData } from './lib/data/dashboard';

const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.profile.findFirst({
    where: { role: Role.ADMIN }
  });

  if (!profile) {
    console.log("No admin profile found");
    return;
  }

  console.log("Admin profile found:", profile.email);
  try {
    const dashboard = await getDashboardData(profile.id);
    console.log("Dashboard loaded successfully!");
    console.log("Summary metrics:", dashboard.summary);
  } catch (error) {
    console.error("Dashboard crashed!");
    console.error(error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
