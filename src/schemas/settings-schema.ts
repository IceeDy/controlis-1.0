import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(3, "Informe o nome da empresa."),
  segment: z.string().min(2, "Informe o segmento."),
  email: z.email("Informe um email válido."),
  phone: z.string().min(10, "Informe um telefone válido."),
  preferredTheme: z.enum(["light", "dark"]),
  compactDashboard: z.boolean(),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
