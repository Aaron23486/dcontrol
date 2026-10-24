import { Module } from '@nestjs/common';
import { PrismaUsersRepository, UsersRepository } from './users.repository';

@Module({
  providers: [{ provide: UsersRepository, useClass: PrismaUsersRepository }],
  exports: [UsersRepository],
})
export class UsersModule {}
