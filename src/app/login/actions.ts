'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export async function login(prevState: { message: string }, formData: FormData) {
  try {
    const validatedFields = FormSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.issues.map(issue => issue.message).join(' ');
      return {
        message: errorMessage,
      };
    }

    const { email, password } = validatedFields.data;

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { message: error.message };
    }

    if (data.user) {
      redirect('/dashboard');
    }
    
    return { message: 'An unknown error occurred during sign in.' };

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Login Error:', error);
    return { message: 'An unknown error occurred during sign in.' };
  }
} 