import { validateOrReject } from 'class-validator';

export async function validateEntity<T extends object>(entity: T): Promise<T> {
  await validateOrReject(entity, { whitelist: true, forbidNonWhitelisted: true });
  return entity;
}
