import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export type CreateUserInput = {
  email: string
  password: string
  fullName: string
  role: UserRole
  clientId: string | null
}

export async function createManagedUser(input: CreateUserInput) {
  return supabase.functions.invoke('create-user', {
    body: {
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      role: input.role,
      client_id: input.clientId,
    },
  })
}

export async function deleteManagedUser(userId: string) {
  return supabase.functions.invoke('delete-user', {
    body: {
      user_id: userId,
    },
  })
}
