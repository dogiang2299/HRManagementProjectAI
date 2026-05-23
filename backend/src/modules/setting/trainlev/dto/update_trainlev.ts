import { PartialType } from "@nestjs/mapped-types";
import {CreateTrainingLevelDTO} from "./create_trainlev"
export class UpdateTrainingLevelDTO extends PartialType(
    CreateTrainingLevelDTO,
){}