import { PartialType } from '@nestjs/mapped-types';
import { CreateInforCompanyDTO } from './created_inforcom';

export class UpdateInforCompanyDTO extends PartialType(CreateInforCompanyDTO) {}