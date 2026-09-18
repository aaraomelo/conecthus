import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): { name: string; version: number } {
    return { name: 'Conecthus - Task Manager API', version: 1 };
  }
}