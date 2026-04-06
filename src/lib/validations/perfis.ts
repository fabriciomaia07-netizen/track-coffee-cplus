import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional()
);

export const flavorProfileSchema = z.object({
  roast_session_id: z.string().uuid().optional().or(z.literal("")),
  green_coffee_lot_id: z.string().uuid().optional().or(z.literal("")),
  acidity: z.coerce.number().min(1).max(10),
  body: z.coerce.number().min(1).max(10),
  sweetness: z.coerce.number().min(1).max(10),
  bitterness: z.coerce.number().min(1).max(10),
  aftertaste: z.coerce.number().min(1).max(10),
  tasting_notes: z.string().optional(),
  sca_score: optionalNumber,
});

export type FlavorProfileInput = z.infer<typeof flavorProfileSchema>;
