import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTrainingLevelDTO } from './dto/create_trainlev';
import { generateCode } from 'src/common/utils/generate-code.util';
import { TrainingLevelFilterType } from './dto/filter_type';
import { TrainingLevelPaginType } from './dto/pagin_type';
import { UpdateTrainingLevelDTO } from './dto/update_trainlev';

@Injectable()
export class TrainlevService {
    constructor (private prismaService: PrismaService){}
    async create(data: CreateTrainingLevelDTO) {
  const { level_code, ...rest } = data;

  const lastLevel = await this.prismaService.setting_Training_Level.findFirst({
    where: {
      level_code: {
        not: null,
        startsWith: 'TL_',
      },
    },
    orderBy: {
      level_code: 'desc',
    },
    select: { level_code: true },
  });

  let nextNumber = 1;
  const last = lastLevel?.level_code;

  if (last) {
    const match = last.match(/^TL_(\d+)$/);
    if (match) nextNumber = Number(match[1]) + 1;
  }

  const levelCode = generateCode('TL', nextNumber);

  return this.prismaService.setting_Training_Level.create({
    data: {
      ...rest,
      level_code: levelCode,
    },
  });
}
async getAll(filter: TrainingLevelFilterType): Promise<TrainingLevelPaginType> {
  const items_per_pages = Number(filter.items_per_pages) || 10;
  const pages = Number(filter.pages) || 1;
  const search = filter.search ? filter.search.trim() : '';

  const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

  const whereCondition = {
    is_active: true,
    OR: [
      { name_level: { contains: search, mode: 'insensitive' as const } },
      { level_code: { contains: search, mode: 'insensitive' as const } },
    ],
  };

  const [levels, total_items] = await Promise.all([
    this.prismaService.setting_Training_Level.findMany({
      take: items_per_pages,
      skip,
      where: whereCondition,
      orderBy: { created_at: 'desc' },
    }),
    this.prismaService.setting_Training_Level.count({
      where: whereCondition,
    }),
  ]);

  return {
    data: levels,
    current_pages: pages,
    items_per_pages,
    total_items,
  };
}
async getByID(id: string) {
  const level = await this.prismaService.setting_Training_Level.findUnique({
    where: { id },
  });

  if (!level) {
    throw new NotFoundException('Training level not found');
  }

  return level;
}
async update(id: string, data: UpdateTrainingLevelDTO) {
  const level = await this.prismaService.setting_Training_Level.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!level) {
    throw new NotFoundException('Training level not found');
  }

  return this.prismaService.setting_Training_Level.update({
    where: { id },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });
}
async delete(id: string) {
  const level = await this.prismaService.setting_Training_Level.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!level) {
    throw new NotFoundException('Training level not found');
  }

  return this.prismaService.setting_Training_Level.update({
    where: { id },
    data: {
      is_active: false,
      updated_at: new Date(),
    },
  });
}
}
