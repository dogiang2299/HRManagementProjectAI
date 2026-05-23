import { Prisma } from '@prisma/client';

export type SkillWithParent = Prisma.SkillGetPayload<{
  include: {
    parent: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type SkillPaginType = {
  data: SkillWithParent[];
  current_pages: number;
  items_per_pages: number;
  total_items: number;
};