import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'Investor Research API is running',
    };
  }

  getVersion(): { version: string; timestamp: string } {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
