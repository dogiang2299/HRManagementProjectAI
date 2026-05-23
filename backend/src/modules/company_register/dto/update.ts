export class UpdateCompanyRegistrationDto {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;

  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  recruitmentNeeds?: string;
  status?: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  is_active?: boolean;
}