import { Recruitment_Infor } from "@prisma/client";

export class RecruitmentInforPaginType {
  total_items: number;
  data: Recruitment_Infor[];
  current_pages: number;
  items_per_pages: number;
}