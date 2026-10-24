import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Hash de contraseñas con argon2id. Sin dependencias, para usarlo también desde scripts. */
@Injectable()
export class PasswordHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
