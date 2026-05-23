export class CompanyRegistrationFilterType {
  search?: string;
  status?: 'pending' | 'approved' | 'rejected';
  items_per_pages?: number;
  pages?: number;
}