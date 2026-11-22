
import type { InternalUser } from '@/types';

const API_URL = '/api/users';

interface UserResponse {
  success: boolean;
  message?: string;
  users?: InternalUser[];
  user?: InternalUser;
}

async function request(
  endpoint: string,
  options: RequestInit = {}
): Promise<UserResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: UserResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Ocurrió un error al gestionar el usuario.');
  }

  return data;
}

export const userService = {
  async getAll(): Promise<InternalUser[]> {
    const data = await request('');

    return data.users || [];
  },

  async create(user: {
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'vendor';
    password: string;
  }): Promise<InternalUser> {
    const data = await request('', {
      method: 'POST',
      body: JSON.stringify(user),
    });

    if (!data.user) {
      throw new Error('El servidor no devolvió el usuario creado.');
    }

    return data.user;
  },

  async update(
    id: string,
    user: {
      name: string;
      email: string;
      phone: string;
      role: 'admin' | 'vendor';
      password?: string;
    }
  ): Promise<InternalUser> {
    const data = await request(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });

    if (!data.user) {
      throw new Error('El servidor no devolvió el usuario actualizado.');
    }

    return data.user;
  },

  async setStatus(
    id: string,
    status: 'activo' | 'inactivo'
  ): Promise<void> {
    await request(`/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async remove(id: string): Promise<void> {
    await request(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
