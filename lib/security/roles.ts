import type { Role } from '../../config/roles.config';
import { APP_CONFIG } from '../../config/app.config';

export function isBootstrapOwner(email?: string | null) {
  return (email ?? '').trim().toLowerCase() === APP_CONFIG.bootstrapOwnerEmail.toLowerCase();
}

export function roleLabelKey(role: Role) {
  return role;
}
