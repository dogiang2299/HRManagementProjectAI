import { Module } from "@nestjs/common";
import { CompanyFollowController } from "./company-follow.controller";
import { CompanyFollowService } from "./company-follow.service";
import { PrismaService } from "src/prisma.service";

@Module({
  controllers: [CompanyFollowController],
  providers: [CompanyFollowService, PrismaService],
  exports: [CompanyFollowService],
})
export class CompanyFollowModule {}