import { HttpException, HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import {Pool} from 'pg';
import {PrismaPg} from '@prisma/adapter-pg';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy{
    constructor (){
        const url = (process.env.DATABASE_URL || "").trim();
        if (!url) throw new HttpException('URL has not been existed', HttpStatus.BAD_REQUEST, {cause: new Error('Cause error')});
        const pool = new Pool({ connectionString: url });
        const adapter = new PrismaPg(pool);

        super({adapter});

    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
}