import { useEffect, useState } from "react";
import Transfer from "./Transfer.jsx";
import BalancePreview, { formatNpr } from "./BalancePreview.jsx";
import Statement from "./Statement.jsx";

const API_BASE = "/api/auth";

const fetchMe = async () => {
  const response = await fetch(`${API_BASE}/me`);
  if (!response.ok) return null;
  return response.json().then((data) => data.user);
};

const authRequest = async (path, body) => {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

function Button({ children, className, ...props }) {
  return (
    <button
      className={`mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 dark:bg-primary-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 dark:hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Message({ message, type, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onDismiss?.(), 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="min-h-[56px]">
      <div
        className={`transition-all duration-300 ease-in-out ${message ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {message && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
              type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              {type === "error" ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span className="flex-1">{message}</span>
            <button
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1 transition hover:bg-black/5"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}
      </div>
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
      <Message message={message} type={messageType} onDismiss={() => setMessage(null)} />
    </form>
  );
}

function Profile({ user }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md h-fit sticky top-8">
      <div className="space-y-1 pb-6 border-b border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">
          Account Status
        </p>
        <p className="text-sm font-medium text-slate-700">Active & Verified</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2">
            Security
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <p className="text-sm font-medium text-slate-700">Secured</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2">
            Account Created
          </p>
          <p className="text-sm font-medium text-slate-700">
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
          Need Help?
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Contact our support team for any assistance with your account or
          transactions.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("signin");
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [view, setView] = useState("dashboard");

  // Load user on mount if session cookie exists
  useEffect(() => {
    fetchMe().then((userData) => {
      if (userData) setUser(userData);
    });
  }, []);

  const handleSuccess = (userData) => {
    setUser(userData);
    setStatusMessage("Authentication succeeded.");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStatusMessage(null);
  };

  const handleTransferSuccess = async () => {
    const refreshed = await fetchMe();
    if (refreshed) setUser(refreshed);
    setStatusMessage("Transfer completed successfully.");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {!user && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
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
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ${mode === "signin" ? "bg-primary-600 dark:bg-primary-800 text-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-primary-600 dark:bg-primary-800 text-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}

        <Message message={statusMessage} type="success" onDismiss={() => setStatusMessage(null)} />

        {user ? (
          <>
            {/* Navigation tabs */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shadow-inner">
                  <button
                    onClick={() => { setView("dashboard"); setShowTransfer(false); }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      view === "dashboard"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </span>
                  </button>
                  <button
                    onClick={() => setView("statement")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      view === "statement"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Statement
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">{user.name}</p>
                    <p className="text-xs font-semibold text-slate-700">{formatNpr(user.walletBalance)}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 duration-150"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            {view === "dashboard" ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
                  <div className="mb-8 border-b border-slate-200 pb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2">
                      Welcome
                    </p>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">
                      {user.name}
                    </h1>
                    <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                      Manage your wallet securely with instant transactions in
                      Nepalese Rupees. Your account is protected with
                      enterprise-grade security.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 border border-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
                        Email Address
                      </p>
                      <p className="text-lg font-semibold text-slate-900 break-all">
                        {user.email}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 border border-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
                        Account Type
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary-600"></span>
                        <p className="text-lg font-semibold text-slate-900 capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 border border-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
                        Member Since
                      </p>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 p-5 border border-primary-200">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary-700 mb-3">
                        Current Balance
                      </p>
                      <p className="text-lg font-bold text-primary-900">
                        {formatNpr(user.walletBalance)}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-4 w-full"
                    onClick={() => setShowTransfer((prev) => !prev)}
                  >
                    {showTransfer ? "Hide Transfer" : "Transfer Money"}
                  </Button>
                  {showTransfer && (
                    <div className="mt-4">
                      <Transfer onTransferSuccess={handleTransferSuccess} />
                    </div>
                  )}
                </div>

                <Profile user={user} />
              </div>
            ) : (
              <Statement user={user} />
            )}
          </>
        ) : (
          <AuthForm mode={mode} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}

export default App;
