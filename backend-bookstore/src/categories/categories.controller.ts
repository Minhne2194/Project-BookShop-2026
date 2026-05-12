import { Controller, Get, Post, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories') // Đường dẫn API là: http://localhost:3000/categories
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Body()
    body: {
      name: string;
      slug: string;
      level: number;
      parent_id?: string;
    },
  ) {
    return this.categoriesService.create(body);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }
}
