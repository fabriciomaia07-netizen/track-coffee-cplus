import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().positive().optional()
);

const optionalInt = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().positive().optional()
);

const optionalUuid = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.string().uuid().optional()
);

export const recipeSchema = z.object({
  title: z.string().min(1, "Required"),
  method: z.enum([
    "espresso",
    "v60",
    "french_press",
    "aeropress",
    "chemex",
    "cold_brew",
    "moka_pot",
    "weber_bird",
    "other",
  ]),
  roast_session_id: optionalUuid,
  green_coffee_lot_id: optionalUuid,
  dose_grams: optionalNumber,
  water_ml: optionalNumber,
  temperature_celsius: optionalNumber,
  brew_time_seconds: optionalInt,
  grind_size: z.string().optional(),
  instructions: z.string().optional(),
  is_shared: z.boolean().default(false),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Required"),
  recipe_id: z.string().uuid(),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
