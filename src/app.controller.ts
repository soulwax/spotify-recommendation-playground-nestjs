// File: src/app.controller.ts

import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Landing page' })
  @ApiResponse({
    status: 200,
    description: 'Renders a short overview page and links to documentation',
    type: String,
  })
  getLandingPage(): string {
    return this.appService.getLandingPage();
  }
}
