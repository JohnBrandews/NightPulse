const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'nightpulse@gmail.com';
    const password = 'Admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`Creating/Updating admin user: ${email}`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                isVerified: true,
            },
            create: {
                email,
                password: hashedPassword,
                name: 'Admin User',
                role: 'admin',
                isActive: true,
                isVerified: true,
            },
        });
        console.log('Admin user created/updated:', user);
    } catch (e) {
        console.error('Error creating admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
