import { SettingEmail } from '@prisma/client';

export class SettingEmailOtherPaginType {
  data: SettingEmail[];
  current_pages: number;
  items_per_pages: number;
  total_items: number;
}