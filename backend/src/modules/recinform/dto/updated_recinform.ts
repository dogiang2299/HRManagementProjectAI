import { PartialType } from '@nestjs/mapped-types';
import { CreateRecruitmentInforDto } from './created_recinform';

export class UpdateRecruitmentInforDto extends PartialType(
  CreateRecruitmentInforDto,
) {}
