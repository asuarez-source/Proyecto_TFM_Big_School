import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { validateEnvironment } from './config/environment.validation';
import { CanbusCatalogModule } from './modules/canbus-catalog/canbus-catalog.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'mysql',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        logging: config.get<boolean>('DB_LOGGING') ? console.debug : false,
        timezone: '+00:00',
        autoLoadModels: true,
        synchronize: false,
      }),
    }),
    HealthModule,
    CanbusCatalogModule,
  ],
})
export class AppModule {}
