import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create';

export class UpdateJobDto extends PartialType(CreateJobDto) {}