import { useState } from "react";

// API endpoint for money transfer
const API_BASE = "/api";

function Transfer({ onTransferSuccess }) {
  const [toUserEmail, setToUserEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("success");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!toUserEmail || !amount || Number(amount) <= 0) {
      setMessage("Recipient and a positive amount are required.");
      setType("error");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserEmail: toUserEmail,
          amount: Number(amount),
          memo,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Transfer failed.");
        setType("error");
      } else {
        setMessage("Transfer successful!");
        setType("success");
        if (onTransferSuccess) onTransferSuccess(data.transaction);
        setToUserEmail("");
        setAmount("");
        setMemo("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error while processing transfer.");
      setType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToUserEmail("");
    setAmount("");
    setMemo("");
    setMessage(null);
  };

  const messageClass = type === "error" 
    ? "bg-red-50 border border-red-200 text-red-700" 
    : "bg-emerald-50 border border-emerald-200 text-emerald-700";

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
      <div className="mb-8 border-b border-slate-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2">
          Money Transfer
        </p>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Send Money</h2>
        <p className="text-base text-slate-600">
          Transfer funds securely to another account in Nepalese Rupees.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 mb-2 block">Recipient Email Address</span>
              <input
                type="email"
                value={toUserEmail}
                onChange={(e) => setToUserEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder="user@example.com"
              />
            </label>
            <p className="mt-1 text-xs text-slate-500">The registered email of the recipient</p>
          </div>

          <div>
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 mb-2 block">Amount (NPR)</span>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 font-semibold">₨</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white pl-7 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  placeholder="0.00"
                />
              </div>
            </label>
            <p className="mt-1 text-xs text-slate-500">Enter amount in Nepalese Rupees</p>
          </div>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-semibold text-slate-900 mb-2 block">Purpose (Optional)</span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              placeholder="E.g., Payment for services, Loan repayment..."
              rows={3}
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">Add a description for your reference</p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed duration-150"
        >
          {loading ? "Processing…" : "Send Money"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed duration-150"
        >
          Clear
        </button>
      </div>

      {message && (
        <div className={`mt-6 rounded-2xl p-4 text-sm font-medium ${messageClass}`}>
          {message}
        </div>
      )}
    </form>
  );
}

export default Transfer;
