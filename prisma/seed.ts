import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: await hash('password123', 10),
        name: 'Test User',
      },
    });

    console.log('✓ Test user created/updated:', testUser.email);

    // Initialize user preferences if not exists
    const prefs = await prisma.userPreference.findUnique({
      where: { userId: testUser.id },
    });

    if (!prefs) {
      await prisma.userPreference.create({
        data: {
          userId: testUser.id,
          nightMode: false,
        },
      });
      console.log('✓ User preferences created');
    }

    console.log('✓ Seed completed successfully');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
