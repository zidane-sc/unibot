export function extractText(_message: unknown): string {
  // TODO: support Baileys message parsing
  return '';
}

export function stripMention(text: string, botJid: string): string {
  // TODO: remove bot mention from text reliably
  return text.replace(new RegExp(botJid, 'gi'), '').trim();
}
