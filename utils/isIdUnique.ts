export function isIdUnique(ids: string[]): boolean {
  const idSet = new Set<string>();

  for (const id of ids) {
    if (idSet.has(id)) {
      return false;
    }
    idSet.add(id);
  }

  return true;
}
