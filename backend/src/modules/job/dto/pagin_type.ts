import { Job } from '@prisma/client';

export type JobPaginType = {
  data: Job[];
  current_pages: number;
  items_per_pages: number;
  total_items: number;
};