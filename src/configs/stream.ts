import { StreamChat } from "stream-chat";

export const streamServerClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!,
);
