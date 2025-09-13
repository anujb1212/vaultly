"use client";
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <div>
        <button onClick={() => router.push('/signup')} className="mr-4 px-4 py-2 bg-blue-600 text-white rounded">Sign Up</button>
        <button onClick={() => router.push('/signin')} className="px-4 py-2 border rounded">Sign In</button>
      </div>
    </div>
  );
}

