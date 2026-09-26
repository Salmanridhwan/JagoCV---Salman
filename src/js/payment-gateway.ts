// Halaman simulasi payment gateway jagoCV.
// Menerima parameter dari checkout.php lewat query string:
//   ?ref=...&package=...&points=...&amount=...&method=...
// Saat user menekan "Bayar Sekarang", script memanggil POST /backend/confirm.php
// untuk menyelesaikan transaksi dan menambah poin.

const API_BASE =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost/jagoCV---Salman/backend";

const TOKEN_KEY = "jagocv_token";

const params = new URLSearchParams(window.location.search);
const paymentRef = params.get("ref") ?? "";
const pkgName = params.get("package") ?? "—";
const pkgPoints = params.get("points") ?? "—";
const pkgAmount = Number(params.get("amount") ?? "0");
const pkgMethod = (params.get("method") ?? "qris").toUpperCase();

// ── Isi ringkasan transaksi ──────────────────────────────────────────
document.getElementById("pay-package")!.textContent = pkgName;
document.getElementById("pay-points")!.textContent = `${pkgPoints} poin`;
document.getElementById("pay-method")!.textContent = pkgMethod;
document.getElementById("pay-ref")!.textContent = paymentRef || "—";
document.getElementById("pay-amount")!.textContent = `Rp ${pkgAmount.toLocaleString("id-ID")}`;

const btnPay = document.getElementById("btn-pay-now") as HTMLButtonElement;
const btnCancel = document.getElementById("btn-pay-cancel") as HTMLButtonElement;

// ── Bayar sekarang ───────────────────────────────────────────────────
btnPay.addEventListener("click", async () => {
  if (!paymentRef) {
    showResult(false, "Referensi pembayaran tidak ditemukan di URL.");
    return;
  }
  setLoading(true);
  await finishPayment("success");
});

// ── Batalkan pembayaran ──────────────────────────────────────────────
btnCancel.addEventListener("click", async () => {
  if (!paymentRef) {
    window.location.href = "/";
    return;
  }
  setLoading(true);
  await finishPayment("failed");
});

function setLoading(loading: boolean): void {
  btnPay.disabled = loading;
  btnCancel.disabled = loading;
  if (loading) {
    btnPay.dataset.originalHtml = btnPay.innerHTML;
    btnPay.innerHTML =
      '<svg class="w-5 h-5 animate-spin inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Memproses...';
  } else if (btnPay.dataset.originalHtml) {
    btnPay.innerHTML = btnPay.dataset.originalHtml;
  }
}

async function finishPayment(status: "success" | "failed"): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY) ?? "";
  try {
    const res = await fetch(`${API_BASE}/confirm.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_ref: paymentRef, status }),
    });

    if (res.status === 401) {
      showResult(false, "Sesi tidak valid. Silakan login ulang lalu ulangi top up.");
      return;
    }

    const data = (await res.json().catch(() => null)) as
      | { ok: boolean; message?: string; points?: number; status?: string }
      | null;

    if (data && data.ok) {
      if (data.status === "failed") {
        showResult(false, "Pembayaran dibatalkan. Anda bisa mencoba lagi kapan saja.");
        return;
      }
      const balance = data.points ?? 0;
      // Simpan saldo terbaru agar chip poin langsung benar setelah kembali.
      localStorage.setItem("jagocv_points_cache", String(balance));
      showResult(true, `Pembayaran berhasil! Poin Anda bertambah.`, balance);
    } else {
      showResult(false, data?.message ?? "Pembayaran gagal diproses.");
    }
  } catch {
    showResult(false, "Tidak dapat menghubungi server. Pastikan Apache & MySQL menyala.");
  } finally {
    setLoading(false);
  }
}

function showResult(success: boolean, message: string, points = 0): void {
  const detail = document.getElementById("pay-detail")!;
  const result = document.getElementById("pay-result")!;
  const badge = document.getElementById("pay-status-badge")!;
  const icon = document.getElementById("pay-result-icon")!;
  const title = document.getElementById("pay-result-title")!;
  const desc = document.getElementById("pay-result-desc")!;
  const pointsEl = document.getElementById("pay-result-points")!;

  detail.classList.add("hidden");
  result.classList.remove("hidden");

  if (success) {
    badge.textContent = "Berhasil";
    badge.className =
      "ml-auto px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[11px] font-bold uppercase tracking-wide";
    pointsEl.textContent = `+${points} poin`;
  } else {
    badge.textContent = "Gagal";
    badge.className =
      "ml-auto px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wide";
    icon.className =
      "w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500";
    icon.innerHTML =
      '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    title.textContent = "Pembayaran Gagal";
    pointsEl.textContent = "—";
  }
  desc.textContent = message;
}
