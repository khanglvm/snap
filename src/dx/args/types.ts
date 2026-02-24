export type CliArgs = Record<string, string | boolean>;

export type UpperSnakeCaseKey = string & { readonly __upperSnakeCaseKey: unique symbol };

export const isUpperSnakeCaseKey = (value: string): value is UpperSnakeCaseKey =>
  /^[A-Z_][A-Z0-9_]*$/.test(value);
