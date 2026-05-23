import { Rank } from "@prisma/client";

export class RankPaginType {
    total_items: number;
    data: Rank[]
    items_per_pages: number;
    current_pages: number;
}