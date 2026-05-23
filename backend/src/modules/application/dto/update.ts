import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create';

export class UpdateApplicationStatusDto extends PartialType(CreateApplicationDto) {}