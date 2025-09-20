"use client";

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <div className="text-center space-y-6 p-10 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl">
        <h1 className="text-5xl font-extrabold text-indigo-700 drop-shadow-sm">
          Welcome
        </h1>
        <p className="text-lg text-gray-600">
          Start your journey by creating an account or log in to continue.
        </p>
        <div className="flex gap-6 justify-center">
          <button
            onClick={() => router.push('/signup')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-200"
          >
            Sign Up
          </button>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-3 border-2 border-indigo-500 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 hover:scale-105 transition-transform duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
