export type GroupRegistryEntry = {
  groupJid: string;
  classId: string;
};

const registry = new Map<string, GroupRegistryEntry>();

export function upsertGroup(entry: GroupRegistryEntry) {
  // TODO: persist in database instead of in-memory map
  registry.set(entry.groupJid, entry);
}

export function findGroup(groupJid: string): GroupRegistryEntry | undefined {
  return registry.get(groupJid);
}
