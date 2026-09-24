// RSS feed of the latest events (Chinese).
import { feed } from "@/lib/feed";

export const revalidate = 1800;
export const GET = () => feed(true);
