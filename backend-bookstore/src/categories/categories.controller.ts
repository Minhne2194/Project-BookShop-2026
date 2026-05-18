import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
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
      sort_order?: number;
    },
  ) {
    return this.categoriesService.create(body);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    if (!category) throw new NotFoundException(`Category ${id} không tồn tại`);
    return category;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      level?: number;
      parent_id?: string;
      sort_order?: number;
    },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
