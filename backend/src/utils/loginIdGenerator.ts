import prisma from '../config/prisma';

/**
 * Generate a unique Login ID in the format:
 * [2-char company][2-char firstName][2-char lastName][4-digit year][4-digit serial]
 *
 * Example: OIJO20260001
 *
 * Uses DB transaction + unique constraint + retry for race-condition safety.
 */
export async function generateLoginId(
  company: string,
  firstName: string,
  lastName: string,
  joiningDate: Date
): Promise<string> {
  const companyPrefix = company.substring(0, 2).toUpperCase();
  const firstPrefix = firstName.substring(0, 2).toUpperCase();
  const lastPrefix = lastName.substring(0, 2).toUpperCase();
  const year = joiningDate.getFullYear();
  const yearStr = year.toString();

  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const loginId = await prisma.$transaction(async (tx) => {
        // Upsert the counter for this year — atomically increment serial
        const counter = await tx.loginIdCounter.upsert({
          where: { year },
          create: { year, serial: 1 },
          update: { serial: { increment: 1 } },
        });

        const serialStr = counter.serial.toString().padStart(4, '0');
        return `${companyPrefix}${firstPrefix}${lastPrefix}${yearStr}${serialStr}`;
      });

      return loginId;
    } catch (error: any) {
      // If unique constraint violation on loginIdCounter, retry
      if (error.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique Login ID after maximum retries');
}
