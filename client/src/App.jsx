import { useEffect, useState } from "react";
import Transfer from "./Transfer.jsx";

const API_BASE = "/api/auth";
const tokenKey = "payment_system_token";

const fetchMe = async (token) => {
  if (!token) return null;
  const response = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json().then((data) => data.user);
};

const authRequest = async (path, body, token) => {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return response.json().then((data) => ({ status: response.status, data }));
};

function Input({ label, type, value, onChange }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

function Button({ children, ...props }) {
  return (
    <button
      {...props}
      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Message({ message, type }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
    >
      {message}
    </div>
  );
}

function AuthForm({ mode, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const body =
      mode === "signup" ? { name, email, password } : { email, password };
    const { status, data } = await authRequest(mode, body);

    setLoading(false);
    if (status !== 200) {
      setMessage(data.error || "Unable to complete request.");
      setMessageType("error");
      return;
    }

    localStorage.setItem(tokenKey, data.token);
    onSuccess(data.user);
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            {mode === "signin" ? "Sign in" : "Create account"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Secure access to the payment dashboard.
          </p>
        </div>
      </div>

      {mode === "signup" && (
        <Input label="Full name" type="text" value={name} onChange={setName} />
      )}
      <Input label="Email" type="email" value={email} onChange={setEmail} />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Processing…" : mode === "signin" ? "Sign in" : "Sign up"}
      </Button>
      <Message message={message} type={messageType} />
    </form>
  );
}

function Profile({ user, onLogout }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            Welcome back, {user.name}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            You are signed in with {user.email}.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Logout
        </button>
      </div>
      <div className="mt-6 grid gap-3 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
        <div>
          <span className="font-semibold">Role:</span> {user.role}
        </div>
        <div>
          <span className="font-semibold">Member since:</span>{" "}
          {new Date(user.createdAt).toLocaleString()}
        </div>
        <div>
          <span className="font-semibold">Wallet Balance:</span> {user.walletBalance?.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("signin");
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(tokenKey) || null);

  // Load user on mount if token exists
  useEffect(() => {
    if (!token) return;
    fetchMe(token).then((userData) => {
      if (userData) setUser(userData);
    });
  }, [token]);

  const handleSuccess = (userData) => {
    setUser(userData);
    const storedToken = localStorage.getItem(tokenKey);
    setToken(storedToken);
    setStatusMessage("Authentication succeeded.");
  };

  const handleLogout = async () => {
    const currentToken = localStorage.getItem(tokenKey);
    await authRequest("logout", {}, currentToken);
    localStorage.removeItem(tokenKey);
    setUser(null);
    setToken(null);
    setStatusMessage("You have been logged out.");
  };

  const handleTransferSuccess = async (transaction) => {
    // Refresh user data to reflect new wallet balance
    if (token) {
      const refreshed = await fetchMe(token);
      if (refreshed) setUser(refreshed);
    }
    setStatusMessage("Transfer completed successfully.");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Payment System
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                Sign in or create your account
              </h1>
            </div>
            <div className="flex gap-2 rounded-full bg-slate-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${mode === "signin" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>

        {statusMessage && <Message message={statusMessage} type="success" />}

        {user ? (
          <>
            {/* Transfer UI */}
            <Transfer token={token} onTransferSuccess={handleTransferSuccess} />
            <Profile user={user} onLogout={handleLogout} />
          </>
        ) : (
          <AuthForm mode={mode} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}

export default App;
