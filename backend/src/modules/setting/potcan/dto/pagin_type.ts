import { Setting_Potential_Type } from "@prisma/client";

export class PotentialPaginType {
    total_items: number;
    data: Setting_Potential_Type[]
    items_per_pages: number;
    current_pages: number;
}