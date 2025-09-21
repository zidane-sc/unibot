export async function start() {
  // TODO: initialize Baileys socket and register event handlers
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error('Worker failed to start', error);
    process.exit(1);
  });
}
