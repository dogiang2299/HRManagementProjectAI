import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { BlogPostQueryDto } from './dto/blog-post-query.dto';

type BlogPostListResponse = {
  data: BlogPost[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class BlogPostService {
  constructor(private readonly prisma: PrismaService) {}

  private toPositiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  async findAll(query: BlogPostQueryDto): Promise<BlogPostListResponse> {
    const page = this.toPositiveInteger(query.page, 1);
    const limit = Math.min(this.toPositiveInteger(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const category = query.category?.trim();

    const where: Prisma.BlogPostWhereInput = {
      is_published: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: [{ published_at: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const blogPost = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        is_published: true,
      },
    });

    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    return blogPost;
  }
}
