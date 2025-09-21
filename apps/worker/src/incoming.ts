export type IncomingContext = {
  isGroup: boolean;
  isMentioned: boolean;
};

export async function handleIncomingMessage(_ctx: IncomingContext) {
  // TODO: process group messages and ignore DMs unless sending OTP
}
