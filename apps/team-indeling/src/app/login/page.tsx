"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [fout, setFout] = useState("");
  const [laden, setLaden] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFout("");
    setLaden(true);

    const result = await signIn("credentials", {
      email,
      wachtwoord,
      redirect: false,
    });

    setLaden(false);

    if (result?.error) {
      setFout("Ongeldige inloggegevens");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Team-Indeling</h1>
            <p className="text-sm text-gray-500 mt-1">c.k.v. Oranje Wit</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="naam@oranjetwit.nl"
              />
            </div>

            <div>
              <label
                htmlFor="wachtwoord"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Wachtwoord
              </label>
              <input
                id="wachtwoord"
                type="password"
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {fout && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {fout}
              </p>
            )}

            <button
              type="submit"
              disabled={laden}
              className="w-full py-2 px-4 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {laden ? "Inloggen..." : "Inloggen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
