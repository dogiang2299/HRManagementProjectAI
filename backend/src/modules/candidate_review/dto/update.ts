import { PartialType } from "@nestjs/mapped-types";
import { CreateCandidateReviewDto } from "./create";

export class UpdateCandidateReviewDto extends PartialType(CreateCandidateReviewDto) {}