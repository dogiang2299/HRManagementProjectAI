import { Position_Group } from "@prisma/client";

export class PositionGroupPaginType {
  total_items: number;
  data: Position_Group[]
  items_per_pages: number;
  current_pages: number;
}
