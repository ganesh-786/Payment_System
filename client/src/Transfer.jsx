import { useState } from "react";

// API endpoint for money transfer
const API_BASE = "/api";

function Transfer({ token, onTransferSuccess }) {
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
    // Basic client‑side validation
    if (!toUserEmail || !amount || Number(amount) <= 0) {
      setMessage("Recipient and a positive amount are required.");
      setType("error");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        // Notify parent so it can refresh the wallet balance if needed
        if (onTransferSuccess) onTransferSuccess(data.transaction);
        // Reset form fields
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

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg mt-8">
      <h2 className="text-xl font-semibold text-slate-900">Send Money</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Recipient Email</span>
          <input
            type="email"
            value={toUserEmail}
            onChange={(e) => setToUserEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Recipient email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Amount</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="e.g. 25.00"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Memo (optional)</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          rows={2}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Transfer"}
      </button>
      {message && (
        <p className={`mt-2 text-sm ${type === "error" ? "text-red-600" : "text-emerald-600"}`}> {message} </p>
      )}
    </form>
  );
}

export default Transfer;
