import { PartialType } from "@nestjs/mapped-types";
import {CreatePotentialTypeDTO} from "./create_potcan"
export class UpdatePotentialTypeDTO extends PartialType(
    CreatePotentialTypeDTO,
){}