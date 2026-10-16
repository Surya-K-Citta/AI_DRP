// Every file in this folder default-exports an English → Telugu dictionary used by tf().
const modules = import.meta.glob('./*Te.ts', { eager: true }) as Record<
  string,
  { default: Record<string, string> }
>;

export const EXTRA_TE: Record<string, string> = Object.assign(
  {},
  ...Object.values(modules).map((m) => m.default)
);
