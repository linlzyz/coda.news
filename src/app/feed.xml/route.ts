// RSS feed of the latest events (English).
import { feed } from "@/lib/feed";

export const revalidate = 1800;
export const GET = () => feed(false);
