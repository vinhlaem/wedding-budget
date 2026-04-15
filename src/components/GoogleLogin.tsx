"use client";

import { useState } from "react";
import {
  GoogleLogin as GoogleLoginBtn,
  CredentialResponse,
} from "@react-oauth/google";
import { useAuth } from "../lib/AuthProvider";

export default function GoogleLogin() {
  const { loginWithIdToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("Khong nhan duoc credential tu Google.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithIdToken(idToken, "budget");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Dang nhap that bai. Hay thu lai.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <div className="w-full text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-sm text-zinc-400 animate-pulse">
          Dang dang nhap...
        </div>
      ) : (
        <GoogleLoginBtn
          onSuccess={handleSuccess}
          onError={() => setError("Google sign-in that bai. Hay thu lai.")}
          useOneTap
          shape="rectangular"
          size="large"
          width="240"
        />
      )}
    </div>
  );
}
