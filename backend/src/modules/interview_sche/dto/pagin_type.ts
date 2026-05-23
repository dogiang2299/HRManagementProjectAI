import { Interview_Schedule } from '@prisma/client';

export class InterviewPaginType {
  data: Interview_Schedule[];
  current_pages: number;
  items_per_pages: number;
  total_items: number;
}