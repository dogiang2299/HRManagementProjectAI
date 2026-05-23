import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogPostService } from './blog-post.service';
import { BlogPostQueryDto } from './dto/blog-post-query.dto';

@Controller('blog-posts')
export class BlogPostController {
  constructor(private readonly blogPostService: BlogPostService) {}

  @Get()
  findAll(@Query() query: BlogPostQueryDto) {
    return this.blogPostService.findAll(query);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogPostService.findBySlug(slug);
  }
}
