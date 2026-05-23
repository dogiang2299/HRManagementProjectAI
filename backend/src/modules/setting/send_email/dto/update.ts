import { PartialType } from "@nestjs/mapped-types";
import {CreateSettingEmailOtherDto} from "./create"
export class UpdateSettingEmailOtherDto extends PartialType(
    CreateSettingEmailOtherDto,
){}