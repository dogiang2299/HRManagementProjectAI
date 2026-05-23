import { Setting_Training_Level } from "@prisma/client";

export class TrainingLevelPaginType {
    total_items: number;
    data: Setting_Training_Level[]
    items_per_pages: number;
    current_pages: number;
}