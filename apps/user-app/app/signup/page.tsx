"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, name }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Signup failed");
      return;
    }
    await signIn("credentials", { phone, password, callbackUrl: "/" });
  }
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs mx-auto mt-12">
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)" />
      <button type="submit" className="bg-blue-600 text-white rounded py-2">Sign Up</button>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}

