'use client';

import { useActionState } from 'react';
import { login } from '../actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    return await login(formData);
  }, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">WebControl Login</h1>
        
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
            <input 
              name="username" 
              type="text" 
              required 
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <button 
            type="submit" 
            disabled={pending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {pending ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
