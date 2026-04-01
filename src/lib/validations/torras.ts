import { z } from "zod";

export const roastSessionSchema = z.object({
  green_coffee_lot_id: z.string().uuid("Select a green coffee lot"),
  roast_date: z.string().min(1, "Required"),
  input_weight_kg: z.coerce.number().positive("Must be positive"),
  output_weight_kg: z.coerce.number().positive("Must be positive"),
  roast_level: z.enum(["light", "medium", "medium-dark", "dark"]),
  temperature_notes: z.string().optional(),
  roast_profile_notes: z.string().optional(),
});

export type RoastSessionInput = z.infer<typeof roastSessionSchema>;
