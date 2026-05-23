import { PartialType } from "@nestjs/mapped-types";
import {CreateRankDTO} from "./create_rank"
export class UpdateRankDTO extends PartialType(
    CreateRankDTO,
){}