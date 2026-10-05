export function requiredEnvironment(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`Missing configuration: ${key}`);
  return value;
}

export function amqpUrl(env: NodeJS.ProcessEnv): string {
  const username = encodeURIComponent(requiredEnvironment(env, 'AMQP_USERNAME'));
  const password = encodeURIComponent(requiredEnvironment(env, 'AMQP_PASSWORD'));
  const hostname = requiredEnvironment(env, 'AMQP_HOSTNAME');
  const port = parsePort(env.AMQP_PORT ?? '5672', 'AMQP_PORT');
  return `amqp://${username}:${password}@${hostname}:${port}`;
}

export function parsePort(value: string, key: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${key} must be a valid TCP port`);
  return port;
}
