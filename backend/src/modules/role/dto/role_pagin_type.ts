import { Role } from "@prisma/client";

export class RolePaginType{
    items_per_page: number;
    data: Role[];
    current_page: number;
    total_items: number;
}