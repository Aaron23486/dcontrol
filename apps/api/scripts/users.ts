/**
 * Gestión de cuentas desde la terminal (ADR 0008: no hay pantalla de usuarios).
 *
 *   npm run users -- list
 *   npm run users -- create [--role SECURITY|ADMIN]     (por defecto SECURITY: un guarda)
 *   npm run users -- deactivate <correo>
 *   npm run users -- activate <correo>
 *   npm run users -- reset-password <correo>
 *
 * Al crear un ADMIN se pueden usar ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD del entorno.
 * Las contraseñas nunca se imprimen ni se aceptan como argumento.
 */
import { ROLES, Role, emailSchema, newPasswordSchema, userNameSchema } from '@cedi/shared';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { PasswordHasher } from '../src/auth/password-hasher';
import { databaseUrlSchema } from '../src/config/app-config';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserAccountsService, type UserSummary } from '../src/users/user-accounts.service';
import { PrismaUsersRepository } from '../src/users/users.repository';
import { askNewPassword, askValid, closePrompt } from './lib/prompt';

const ROLE_LABEL: Record<Role, string> = { SECURITY: 'Seguridad', ADMIN: 'Administrador' };

const USAGE = `Uso:
  npm run users -- list
  npm run users -- create [--role SECURITY|ADMIN]
  npm run users -- deactivate <correo>
  npm run users -- activate <correo>
  npm run users -- reset-password <correo>`;

const describeUser = (u: UserSummary) =>
  `${u.name} <${u.email}> · ${ROLE_LABEL[u.role]} · ${u.isActive ? 'activo' : 'DESACTIVADO'}`;

async function run(accounts: UserAccountsService): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { role: { type: 'string', default: Role.SECURITY } },
  });
  const [command, emailArg] = positionals;
  const emailFromArg = () => emailSchema.parse(emailArg ?? '');

  switch (command) {
    case 'list': {
      const users = await accounts.list();
      console.log(users.length ? users.map(describeUser).join('\n') : 'No hay usuarios.');
      return;
    }
    case 'create': {
      const role = z.enum(ROLES, { error: 'El rol debe ser SECURITY o ADMIN.' }).parse(values.role);
      const env = role === Role.ADMIN ? process.env : {};
      const name = await askValid(userNameSchema, 'Nombre: ', { envValue: env.ADMIN_NAME });
      const email = await askValid(emailSchema, 'Correo: ', { envValue: env.ADMIN_EMAIL });
      const password = await askNewPassword(newPasswordSchema({ email, name }), env.ADMIN_PASSWORD);
      console.log(
        `Usuario creado: ${describeUser(await accounts.create({ name, email, password, role }))}`,
      );
      return;
    }
    case 'activate':
    case 'deactivate': {
      const user = await accounts.setActive(emailFromArg(), command === 'activate');
      console.log(`Actualizado: ${describeUser(user)}`);
      return;
    }
    case 'reset-password': {
      const email = emailFromArg();
      await accounts.resetPassword(email, await askNewPassword(newPasswordSchema({ email })));
      console.log(`Contraseña actualizada para ${email}.`);
      return;
    }
    default:
      throw new Error(USAGE);
  }
}

async function main(): Promise<void> {
  loadEnvFile();
  const prisma = new PrismaService({
    databaseUrl: databaseUrlSchema.parse(process.env.DATABASE_URL),
  });
  try {
    await run(new UserAccountsService(new PrismaUsersRepository(prisma), new PasswordHasher()));
  } finally {
    closePrompt();
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof z.ZodError
      ? (error.issues[0]?.message ?? 'Datos inválidos.')
      : error instanceof Error
        ? error.message
        : String(error);
  console.error(message);
  process.exit(1);
});
