/**
 * Idempotent seed: upserts the admin account from SEED_ADMIN_* env vars and
 * inserts a sample catalogue only when the vehicles table is empty.
 * Run with `npm run db:seed` (local) or with DATABASE_URL pointed at production.
 */
import { BcryptPasswordHasher } from '../src/infra/bcrypt-password-hasher';
import { createPrismaClient } from '../src/infra/prisma';

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

const vehicles = [
  {
    make: 'Toyota',
    model: 'Camry',
    category: 'SEDAN',
    priceCents: 2_895_000,
    quantity: 6,
    year: 2024,
    color: 'Pearl White',
    fuelType: 'HYBRID',
    transmission: 'AUTOMATIC',
    imageUrl: img('1621007947382-bb3c3994e3fb'),
  },
  {
    make: 'Honda',
    model: 'Civic',
    category: 'SEDAN',
    priceCents: 2_450_000,
    quantity: 4,
    year: 2024,
    color: 'Sonic Grey',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    imageUrl: img('1606611013016-969c19ba27bb'),
  },
  {
    make: 'Tesla',
    model: 'Model Y',
    category: 'SUV',
    priceCents: 4_499_000,
    quantity: 3,
    year: 2025,
    color: 'Midnight Silver',
    fuelType: 'ELECTRIC',
    transmission: 'AUTOMATIC',
    imageUrl: img('1617788138017-80ad40651399'),
  },
  {
    make: 'Ford',
    model: 'F-150',
    category: 'TRUCK',
    priceCents: 4_120_000,
    quantity: 2,
    year: 2024,
    color: 'Agate Black',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    imageUrl: img('1605893477799-b99e3b8b93fe'),
  },
  {
    make: 'BMW',
    model: 'M4',
    category: 'COUPE',
    priceCents: 7_890_000,
    quantity: 1,
    year: 2025,
    color: 'Isle of Man Green',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    imageUrl: img('1617814076367-b759c7d7e738'),
  },
  {
    make: 'Volkswagen',
    model: 'Golf GTI',
    category: 'HATCHBACK',
    priceCents: 3_150_000,
    quantity: 5,
    year: 2024,
    color: 'Kings Red',
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    imageUrl: img('1541899481282-d53bffe3c35d'),
  },
  {
    make: 'Mazda',
    model: 'MX-5 Miata',
    category: 'CONVERTIBLE',
    priceCents: 2_995_000,
    quantity: 0,
    year: 2024,
    color: 'Soul Red',
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    imageUrl: img('1580274455191-1c62238fa333'),
  },
  {
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    category: 'VAN',
    priceCents: 5_210_000,
    quantity: 2,
    year: 2023,
    color: 'Arctic White',
    fuelType: 'DIESEL',
    transmission: 'AUTOMATIC',
    imageUrl: img('1559416523-140ddc3d238c'),
  },
  {
    make: 'Volvo',
    model: 'V60',
    category: 'WAGON',
    priceCents: 4_650_000,
    quantity: 0,
    year: 2024,
    color: 'Denim Blue',
    fuelType: 'HYBRID',
    transmission: 'AUTOMATIC',
    imageUrl: img('1609521263047-f8f205293f24'),
  },
] as const;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!url || !email || !password) {
    throw new Error('DATABASE_URL, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }
  const prisma = createPrismaClient(url);
  try {
    const passwordHash = await new BcryptPasswordHasher(12).hash(password);
    const name = process.env.SEED_ADMIN_NAME ?? 'Admin';
    await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN', passwordHash, name },
      create: { email, name, passwordHash, role: 'ADMIN' },
    });
    if ((await prisma.vehicle.count()) === 0) {
      await prisma.vehicle.createMany({ data: vehicles.map((v) => ({ ...v })) });
    }
    console.log(`Seeded admin ${email} and ${await prisma.vehicle.count()} vehicles`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
