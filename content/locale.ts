/** Supported locales. Add "sv" here, then a Swedish entry in each content file. */
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
