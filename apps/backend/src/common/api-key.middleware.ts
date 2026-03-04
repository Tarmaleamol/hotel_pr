import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    if (req.path === '/health' || req.path === '/health/' || req.path === '/favicon.ico') {
      next();
      return;
    }

    const serverKey = process.env.API_KEY;
    const clientKey = req.header('x-api-key');

    if (!serverKey || clientKey !== serverKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    next();
  }
}
