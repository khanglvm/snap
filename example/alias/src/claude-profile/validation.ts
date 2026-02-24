export const isValidAliasName = (value: string): boolean => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());

export const validateAliasName = (aliasName: string): string => {
  const name = aliasName.trim();
  if (name.length === 0) {
    throw new Error('Alias name is required.');
  }
  if (!isValidAliasName(name)) {
    throw new Error(`Invalid alias name "${name}". Use [A-Za-z_][A-Za-z0-9_]*.`);
  }
  return name;
};

export const isValidEnvKey = (value: string): boolean => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());

export const validateEnvKey = (key: string): string => {
  const cleaned = key.trim();
  if (!isValidEnvKey(cleaned)) {
    throw new Error(`Invalid env key "${cleaned}".`);
  }
  return cleaned;
};
