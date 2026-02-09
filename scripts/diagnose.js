const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTICS ---');

    // Check Admin
    const adminEmail = 'nightpulse@gmail.com';
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    console.log('Admin User:', admin);

    if (admin) {
        const isMatch = await bcrypt.compare('Admin123', admin.password);
        console.log('Password match for "Admin123":', isMatch);
    }

    // Check Clubs
    const clubs = await prisma.club.findMany();
    console.log('Total Clubs:', clubs.length);
    clubs.forEach(c => {
        console.log(`Club: ${c.name}, isActive: ${c.isActive}, isVerified: ${c.isVerified}, OwnerId: ${c.ownerId}`);
    });

    // Check Applications
    const apps = await prisma.application.findMany();
    console.log('Total Applications:', apps.length);

    await prisma.$disconnect();
}

main();
