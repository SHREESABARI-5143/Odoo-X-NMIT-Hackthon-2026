import { z } from 'zod';

export const documentUploadSchema = z.object({
  documentType: z.enum([
    'AADHAAR', 'PAN', 'RESUME', 'OFFER_LETTER',
    'JOINING_LETTER', 'EXPERIENCE_CERTIFICATE', 'BANK_DOCUMENT', 'OTHER',
  ]),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
