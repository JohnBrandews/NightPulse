import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';
import { KENYA_COUNTIES } from '../lib/kenya-counties';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Starting seed...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await prisma.booking.deleteMany();
    // await prisma.message.deleteMany();
    // await prisma.dJGigApplication.deleteMany();
    // await prisma.event.deleteMany();
    // await prisma.club.deleteMany();
    // await prisma.user.deleteMany();
    // console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@nightpulse.com' },
      update: {},
      create: {
        email: 'admin@nightpulse.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'admin',
        county: 'Nairobi',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created/Updated admin user');

    // Create regular users
    const userPassword = await hashPassword('user123');
    
    const john = await prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        password: userPassword,
        name: 'John Doe',
        role: 'user',
        gender: 'male',
        lookingFor: 'women',
        dateOfBirth: new Date('1995-05-15'),
        age: 28,
        county: 'Nairobi',
        bio: 'Love electronic music and late nights!',
        isVerified: true,
        isActive: true,
      },
    });

    const sarah = await prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        password: userPassword,
        name: 'Sarah Smith',
        role: 'user',
        gender: 'female',
        lookingFor: 'men',
        dateOfBirth: new Date('1998-03-20'),
        age: 25,
        county: 'Nairobi',
        bio: 'Looking for fun clubbing companions!',
        ageVerified: true,
        idVerificationStatus: 'approved',
        isVerified: true,
        isActive: true,
      },
    });

    const mike = await prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        password: userPassword,
        name: 'Mike Johnson',
        role: 'user',
        gender: 'male',
        lookingFor: 'both',
        dateOfBirth: new Date('1992-11-10'),
        age: 31,
        county: 'Mombasa',
        bio: 'DJ and music enthusiast',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created/Updated regular users');

    // Create club owner
    const clubOwnerPassword = await hashPassword('club123');
    const clubOwner = await prisma.user.upsert({
      where: { email: 'club@example.com' },
      update: {},
      create: {
        email: 'club@example.com',
        password: clubOwnerPassword,
        name: 'Club Manager',
        role: 'club',
        county: 'Nairobi',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created/Updated club owner');

    // Create clubs
    const club1 = await prisma.club.upsert({
      where: { id: 'club1' },
      update: {},
      create: {
        ownerId: clubOwner.id,
        name: 'Neon Nights',
        address: '123 Nightlife Ave, Westlands',
        county: 'Nairobi',
        musicType: JSON.stringify(['Electronic', 'House', 'Techno']),
        dressCode: 'Upscale casual',
        capacity: 500,
        description: 'The hottest electronic music venue in Nairobi. Experience the best DJs and an incredible atmosphere.',
        isVerified: true,
        isActive: true,
      },
    });

    const club2 = await prisma.club.upsert({
      where: { id: 'club2' },
      update: {},
      create: {
        ownerId: clubOwner.id,
        name: 'The Underground',
        address: '456 Club Street, Nyali',
        county: 'Mombasa',
        musicType: JSON.stringify(['Hip Hop', 'R&B', 'Top 40']),
        dressCode: 'Smart casual',
        capacity: 300,
        description: 'Mombasa\'s premier nightlife destination. Featuring top DJs and VIP service.',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created/Updated clubs');

    // Create events
    const event1 = await prisma.event.create({
      data: {
        clubId: club1.id,
        title: 'Friday Night Lights',
        description: 'Epic Friday night with top DJs',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        startTime: '22:00',
        endTime: '04:00',
        eventType: 'featured',
        coverCharge: 25,
        dressCode: 'Upscale casual',
        ageRestriction: 21,
        isFeatured: true,
        isActive: true,
      },
    });

    const event2 = await prisma.event.create({
      data: {
        clubId: club2.id,
        title: 'Saturday Vibes',
        description: 'The best Saturday night party',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        startTime: '23:00',
        endTime: '05:00',
        eventType: 'special',
        coverCharge: 30,
        dressCode: 'Smart casual',
        ageRestriction: 21,
        isFeatured: false,
        isActive: true,
      },
    });
    console.log('Created events');

    // Create bookings
    await prisma.booking.create({
      data: {
        userId: john.id,
        clubId: club1.id,
        eventId: event1.id,
        bookingType: 'table',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time: '22:30',
        numberOfGuests: 4,
        specialRequests: 'Window table preferred',
        status: 'pending',
        paymentStatus: 'pending',
      },
    });

    await prisma.booking.create({
      data: {
        userId: sarah.id,
        clubId: club2.id,
        eventId: event2.id,
        bookingType: 'general',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        time: '23:00',
        numberOfGuests: 2,
        status: 'confirmed',
        paymentStatus: 'paid',
      },
    });
    console.log('Created bookings');

    // Create DJ
    const djPassword = await hashPassword('dj123');
    await prisma.user.upsert({
      where: { email: 'dj@example.com' },
      update: {},
      create: {
        email: 'dj@example.com',
        password: djPassword,
        name: 'DJ MixMaster',
        role: 'dj',
        county: 'Nairobi',
        djName: 'DJ MixMaster',
        djGenre: JSON.stringify(['House', 'Techno', 'Electronic']),
        djBio: 'Professional DJ with 10+ years of experience',
        djMusicLinks: JSON.stringify(['https://soundcloud.com/example']),
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created/Updated DJ user');

    console.log('✅ Seed data created successfully!');
    console.log('\nTest accounts:');
    console.log('Admin: admin@nightpulse.com / admin123');
    console.log('User: john@example.com / user123');
    console.log('User: sarah@example.com / user123');
    console.log('Club: club@example.com / club123');
    console.log('DJ: dj@example.com / dj123');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
