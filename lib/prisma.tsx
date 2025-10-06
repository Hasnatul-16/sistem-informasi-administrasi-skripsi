// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// Deklarasikan variabel global untuk menyimpan instance prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// Buat instance prisma, atau gunakan yang sudah ada jika dalam mode development
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;