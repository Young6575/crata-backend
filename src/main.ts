import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// 서울 시간대 설정
process.env.TZ = 'Asia/Seoul';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 허용
  app.enableCors();

  // 유효성 검사 파이프(DTO 검사)
  // whitelist: true 옵션은 DTO에 없는 엉뚱한 값은 자동으로 걸러줍니다.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
