import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, loadAppConfig } from './app-config';
import { loadEnvFile } from './load-env-file';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => {
        loadEnvFile();
        return loadAppConfig(process.env);
      },
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
