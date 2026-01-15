
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
    // Mock login
    console.log("Mock login for:", formData.get('email'));
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
    // Mock signup
    return { success: true, message: 'Mock account created! (Local Only)' }
}

export async function logout() {
    // Mock logout
    revalidatePath('/', 'layout')
    redirect('/login')
}
