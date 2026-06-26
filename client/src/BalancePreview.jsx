export function formatNpr(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "NPR 0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NPR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(number)
    .replace("NPR", "NPR ");
}

/**
 * BalancePreview – displays the user's wallet balance in a professional card.
 *
 * Props:
 *   user:   object containing `walletBalance` (number).
 *   loading: boolean – when true, shows a skeleton placeholder.
 *
 * Enterprise-grade styling with proper typography and visual hierarchy.
 */
export default function BalancePreview({ user, loading = false }) {
  const balance = user?.walletBalance;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md overflow-hidden">
      <div className="mb-6 pb-6 border-b border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2">
          Wallet Balance
        </p>
        <h3 className="text-sm font-medium text-slate-600">
          Current available funds
        </h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        </div>
      ) : (
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-slate-900">
                {formatNpr(balance).split(" ")[0]}
              </p>
              <p className="text-2xl font-semibold text-slate-700">
                {formatNpr(balance).split(" ")[1]}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              Last updated:{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3 pt-6 border-t border-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
          <span className="text-xl font-bold text-primary-600">₨</span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-600">
            Nepal
          </p>
          <p className="text-sm font-medium text-slate-700">Nepalese Rupees</p>
        </div>
      </div>
    </div>
  );
}
