import { PartialType } from "@nestjs/mapped-types";
import { CreatePositionGroupDTO } from "./create_position_group"

export class UpdatePositionGroupDTO extends PartialType(
    CreatePositionGroupDTO,
){}
