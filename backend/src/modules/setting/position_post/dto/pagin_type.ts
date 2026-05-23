import { Setting_Position_Posts } from "@prisma/client";

export class PostPaginType {
    total_items: number;
    data: Setting_Position_Posts[]
    items_per_pages: number;
    current_pages: number;
}