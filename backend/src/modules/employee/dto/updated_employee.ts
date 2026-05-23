
import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDTO } from './created_employee';

export class UpdatedEmployeeDTO extends PartialType(CreateEmployeeDTO) {}