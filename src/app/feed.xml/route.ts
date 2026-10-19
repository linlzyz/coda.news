// RSS feed of the latest events (English).
import { feed } from "@/lib/feed";

export const revalidate = 3600;
export const GET = () => feed(false);
