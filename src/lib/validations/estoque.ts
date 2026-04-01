import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().positive().optional()
);

export const greenLotSchema = z.object({
  origin_country: z.string().min(1, "Required"),
  farm_producer: z.string().optional(),
  variety: z.string().min(1, "Required"),
  process_method: z.string().min(1, "Required"),
  quantity_kg: z.coerce.number().positive("Must be positive"),
  purchase_date: z.string().min(1, "Required"),
  supplier: z.string().optional(),
  price_per_kg: optionalNumber,
  notes: z.string().optional(),
});

export type GreenLotInput = z.infer<typeof greenLotSchema>;
