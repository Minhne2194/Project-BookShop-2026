import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books') // Đường dẫn API là: http://localhost:3000/books
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  create(@Body() createBookDto: any) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }
// 4. Cập nhật thông tin sách (PUT)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateBookDto: any) {
    return this.booksService.update(id, updateBookDto);
  }

  // 5. Xóa sách (DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}