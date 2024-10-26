import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    DatabaseModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService /*{ provide: APP_GUARD, useClass: AuthGuard }*/],
})
export class AppModule {}
