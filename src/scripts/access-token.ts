import { AppConfigs } from 'src/configs/app.config';
import { TOKEN_TYPE } from 'src/types/global';
import { generateToken } from 'src/utils/jwt';

function getArgValue(name: string, alias?: string): string | undefined {
  const args = process.argv.slice(2);
  const longForm = `--${name}`;
  const shortForm = alias ? `-${alias}` : undefined;

  const longIndex = args.findIndex((arg) => arg === longForm || arg.startsWith(`${longForm}=`));
  if (longIndex >= 0) {
    const arg = args[longIndex];
    if (arg.includes('=')) return arg.split('=')[1];
    return args[longIndex + 1];
  }

  if (shortForm) {
    const shortIndex = args.findIndex(
      (arg) => arg === shortForm || arg.startsWith(`${shortForm}=`),
    );
    if (shortIndex >= 0) {
      const arg = args[shortIndex];
      if (arg.includes('=')) return arg.split('=')[1];
      return args[shortIndex + 1];
    }
  }

  return undefined;
}

function printUsage(): void {
  console.log(
    [
      'Usage:',
      '  yarn script src/scripts/access-token.ts --userId <id>',
      '',
      'Examples:',
      '  yarn script src/scripts/access-token.ts --userId 1',
      '  yarn script src/scripts/access-token.ts -u 42',
    ].join('\n'),
  );
}

function bootstrap() {
  const userIdValue = getArgValue('userId', 'u');
  if (!userIdValue) {
    printUsage();
    process.exit(1);
  }

  const userId = Number(userIdValue);
  if (!Number.isFinite(userId) || userId <= 0) {
    console.error('Invalid userId. Please provide a positive number.');
    process.exit(1);
  }

  if (!AppConfigs.JWT_SECRET || !AppConfigs.JWT_EXPIRE_TIME) {
    console.error('Missing JWT config. Please set JWT_SECRET and JWT_EXPIRE_TIME in .env');
    process.exit(1);
  }

  const token = generateToken(TOKEN_TYPE.ACCESS_TOKEN, { sub: userId });
  console.log(token);
}

bootstrap();
