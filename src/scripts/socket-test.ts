import { io } from 'socket.io-client';
import { MICROSERVICE_EVENTS } from 'src/configs/enum.config';

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
      '  yarn script src/scripts/socket-test.ts --url <socket-url> --token <access-token> --conversationId <id> --message <text>',
      '',
      'Examples:',
      '  yarn script src/scripts/socket-test.ts --url http://localhost:3002 --token <token> --conversationId 1 --message "hello"',
      '  yarn script src/scripts/socket-test.ts -u http://localhost:3002 -t <token> -c 1 -m "hello"',
    ].join('\n'),
  );
}

function bootstrap() {
  const url = getArgValue('url', 'u') ?? 'http://localhost:3002';
  const token = getArgValue('token', 't');
  const conversationIdValue = getArgValue('conversationId', 'c');
  const message = getArgValue('message', 'm') ?? 'hello';

  if (!token || !conversationIdValue) {
    printUsage();
    process.exit(1);
  }

  const conversationId = Number(conversationIdValue);
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    console.error('Invalid conversationId. Please provide a positive number.');
    process.exit(1);
  }

  const socket = io(url, { auth: { token }, transports: ['websocket'] });

  socket.on('connect', () => {
    console.log(`Connected: ${socket.id}`);

    // 1. Join the conversation
    socket.emit(MICROSERVICE_EVENTS.join_conversation, { conversationId });

    const joinTimeout = setTimeout(() => {
      console.error('Join event timeout: no "joined" event received');
    }, 5000);

    socket.once('joined', (payload) => {
      clearTimeout(joinTimeout);
      console.log('Joined event received:', payload);
      console.log('Successfully joined room. Sending message...');
      socket.emit(MICROSERVICE_EVENTS.send_message, { conversationId, message });

      const sendTimeout = setTimeout(() => {
        console.error('Send event timeout: no "message_sent" event received');
      }, 5000);

      socket.once('message_sent', (sendPayload) => {
        clearTimeout(sendTimeout);
        console.log('Message sent event received:', sendPayload);
      });
    });
  });

  socket.on(MICROSERVICE_EVENTS.receive_message, (payload) => {
    console.log('Received message:', payload);
  });

  socket.onAny((event, ...args) => {
    if (event === MICROSERVICE_EVENTS.receive_message) return;
    console.log('Event:', event, ...args);
  });

  socket.on('exception', (payload) => {
    console.error('Exception event:', payload);
  });

  socket.on('error', (err) => {
    console.error('Error event:', err);
  });

  socket.on('connect_error', (err) => {
    console.error('Connect error:', err?.message ?? err);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
  });
}

bootstrap();
