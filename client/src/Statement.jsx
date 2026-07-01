import { useState, useEffect, useCallback } from "react";
import { formatNpr } from "./BalancePreview.jsx";

const API_BASE = "/api";
const PAGE_SIZE = 15;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRef(id) {
  return `TXN${String(id).padStart(8, "0")}`;
}

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.completed}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === "completed" ? "bg-emerald-500" : status === "pending" ? "bg-amber-500" : "bg-red-500"}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TransactionRow({ txn, isExpanded, onToggle }) {
  const isSent = txn.type === "sent";
  const amountDisplay = formatNpr(txn.amount);
  const runningDisplay = txn.runningBalance != null ? formatNpr(txn.runningBalance) : "—";

  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
        onClick={onToggle}
      >
        <td className="py-3.5 px-3 whitespace-nowrap">
          <div className="text-sm font-medium text-slate-900">{formatDate(txn.createdAt)}</div>
          <div className="text-xs text-slate-400">{formatTime(txn.createdAt)}</div>
        </td>
        <td className="py-3.5 px-3">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {formatRef(txn.id)}
          </span>
        </td>
        <td className="py-3.5 px-3 max-w-[200px]">
          <div className="text-sm font-medium text-slate-900 truncate">
            {isSent ? txn.receiver.name : txn.sender.name}
          </div>
          {txn.memo && (
            <div className="text-xs text-slate-400 truncate">{txn.memo}</div>
          )}
          {!txn.memo && (
            <div className="text-xs text-slate-400">{isSent ? "Sent" : "Received"}</div>
          )}
        </td>
        <td className="py-3.5 px-3 text-right whitespace-nowrap">
          <span className={`text-sm font-semibold tabular-nums ${isSent ? "text-red-500" : "text-emerald-600"}`}>
            {isSent ? "−" : "+"}{amountDisplay}
          </span>
        </td>
        <td className="py-3.5 px-3 text-right whitespace-nowrap hidden sm:table-cell">
          <span className="text-sm font-medium text-slate-600 tabular-nums">{runningDisplay}</span>
        </td>
        <td className="py-3.5 px-3 hidden md:table-cell">
          <StatusBadge status={txn.status} />
        </td>
        <td className="py-3.5 px-3 text-right">
          <span className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50/80">
          <td colSpan={7} className="px-3 py-4 border-b border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Transaction ID</p>
                <p className="text-slate-900 font-mono text-xs">{formatRef(txn.id)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Date & Time</p>
                <p className="text-slate-900 text-xs">{formatDate(txn.createdAt)} {formatTime(txn.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{isSent ? "Sent To" : "Received From"}</p>
                <p className="text-slate-900 text-xs font-medium">{isSent ? txn.receiver.name : txn.sender.name}</p>
                <p className="text-slate-400 text-[11px]">{isSent ? txn.receiver.email : txn.sender.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Amount</p>
                <p className={`text-xs font-semibold ${isSent ? "text-red-500" : "text-emerald-600"}`}>
                  {isSent ? "−" : "+"} {amountDisplay}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Transaction Type</p>
                <p className="text-slate-900 text-xs capitalize">{txn.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                <StatusBadge status={txn.status} />
              </div>
              {txn.memo && (
                <div className="col-span-full sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Purpose</p>
                  <p className="text-slate-900 text-xs">{txn.memo}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  const btn = "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150";

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
      <p className="text-xs text-slate-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btn} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-300 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btn} ${p === page ? "bg-primary-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btn} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Statement({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE, type: filterType });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`${API_BASE}/transactions?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch transactions.");
      }
      const data = await res.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, startDate, endDate]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handlePageChange = (page) => {
    setExpandedId(null);
    fetchTransactions(page);
  };

  const handleFilter = () => {
    setExpandedId(null);
    fetchTransactions(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setFilterType("all");
    // fetchTransactions will re-run via useEffect since filterType changes
  };

  const totalSent = transactions
    .filter((t) => t.type === "sent")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions
    .filter((t) => t.type === "received")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = user?.walletBalance ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1">
              Account Statement
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Payment History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View and filter all your transactions
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Balance</p>
            <p className="text-2xl font-bold text-slate-900">{formatNpr(balance)}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Total Sent</p>
          <p className="text-xl font-bold text-red-500">{formatNpr(totalSent)}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {transactions.filter((t) => t.type === "sent").length} transaction(s)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Total Received</p>
          <p className="text-xl font-bold text-emerald-600">{formatNpr(totalReceived)}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {transactions.filter((t) => t.type === "received").length} transaction(s)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">This Page</p>
          <p className="text-xl font-bold text-slate-900">{transactions.length} of {pagination.total}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1 block">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1 block">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1 block">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 duration-150"
            >
              Filter
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 duration-150"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <button
                onClick={() => fetchTransactions(pagination.page)}
                className="mt-2 text-sm font-semibold text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">No transactions found</p>
            <p className="text-sm text-slate-400">Try adjusting your filters or make your first transfer.</p>
          </div>
        ) : (
          <div>
            {/* Table header - hidden on small screens, use card layout instead */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-3 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Date</th>
                    <th className="py-3 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Reference</th>
                    <th className="py-3 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Particulars</th>
                    <th className="py-3 px-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500">Amount</th>
                    <th className="py-3 px-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500 hidden sm:table-cell">Balance</th>
                    <th className="py-3 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 hidden md:table-cell">Status</th>
                    <th className="py-3 px-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      txn={txn}
                      isExpanded={expandedId === txn.id}
                      onToggle={() => setExpandedId(expandedId === txn.id ? null : txn.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map((txn) => {
                const isSent = txn.type === "sent";
                const isExpanded = expandedId === txn.id;
                return (
                  <div key={txn.id}>
                    <div
                      className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-slate-900">{formatDate(txn.createdAt)}</div>
                        <span className={`text-sm font-semibold tabular-nums ${isSent ? "text-red-500" : "text-emerald-600"}`}>
                          {isSent ? "−" : "+"}{formatNpr(txn.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500 truncate mr-2">
                          {isSent ? `To: ${txn.receiver.name}` : `From: ${txn.sender.name}`}
                          {txn.memo && <span className="ml-1 text-slate-400">· {txn.memo}</span>}
                        </div>
                        <span className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-slate-50/80 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reference</span>
                          <span className="font-mono text-slate-700">{formatRef(txn.id)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Time</span>
                          <span className="text-slate-700">{formatTime(txn.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{isSent ? "Sent To" : "Received From"}</span>
                          <span className="text-slate-700 text-right max-w-[50%]">{isSent ? txn.receiver.name : txn.sender.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email</span>
                          <span className="text-slate-700 text-right max-w-[50%]">{isSent ? txn.receiver.email : txn.sender.email}</span>
                        </div>
                        {txn.memo && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Purpose</span>
                            <span className="text-slate-700 text-right max-w-[50%]">{txn.memo}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status</span>
                          <StatusBadge status={txn.status} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-3 pb-3">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
