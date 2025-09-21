export function formatBold(text: string): string {
  // TODO: handle WhatsApp-specific formatting nuances
  return `*${text}*`;
}

export function formatList(items: string[]): string {
  // TODO: improve layout for WhatsApp clients
  return items.map((item) => `• ${item}`).join('\n');
}
