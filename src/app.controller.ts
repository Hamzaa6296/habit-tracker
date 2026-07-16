import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHello(): string {
    console.log(this.configService.get<string>('database.uri'));
    return 'Hello world';
  }
}
