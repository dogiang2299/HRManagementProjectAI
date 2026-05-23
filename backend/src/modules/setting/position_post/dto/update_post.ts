import { PartialType } from "@nestjs/mapped-types";
import {CreatePositionPostDTO} from "./create_post"
export class UpdatePostDTO extends PartialType(
    CreatePositionPostDTO,
){}