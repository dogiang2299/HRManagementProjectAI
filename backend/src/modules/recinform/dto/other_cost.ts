import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class RecOtherCost {
    @IsString()
    @IsOptional()
    cost_type?: string

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    amount?: number

    @IsOptional()
    @IsString()
    currency? : string

}