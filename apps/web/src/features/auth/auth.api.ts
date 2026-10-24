import { type AuthUser, ErrorCode, type LoginInput } from '@cedi/shared';
import { ApiRequestError, apiRequest } from '../../lib/http';

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthUser>('/auth/login', { method: 'POST', body: input }),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),

  /** Devuelve `null` si no hay sesión, en lugar de tratarlo como error. */
  async me(): Promise<AuthUser | null> {
    try {
      return await apiRequest<AuthUser>('/auth/me');
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === ErrorCode.UNAUTHENTICATED) {
        return null;
      }
      throw error;
    }
  },
};
