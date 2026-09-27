// Halaman simulasi payment gateway jagoCV.
// Menerima parameter dari checkout.php lewat query string:
//   ?ref=...&package=...&points=...&amount=...&method=...&st=1
//   st=1 adalah penanda bahwa halaman dibuka dari redirect checkout yang
//   sah (ditambahkan oleh views/pricing.ts). Pembukaan lewat cara lain —
//   mis. tombol Back browser atau refresh setelah sesi berakhir —
//   langsung digantikan (location.replace) dengan halaman aplikasi.
//
// Pengaman navigasi:
//  - Checkout memakai location.replace() sehingga halaman transaksi TIDAK
//    masuk history → tombol Back tidak akan membukanya kembali.
//  - Transaksi yang sudah selesai (berhasil/gagal) ditandai di
//    sessionStorage; bila user tetap berhasil kembali ke halaman ini
//    lewat Back, yang tampil adalah status "sudah diproses", bukan
//    tombol Bayar — jadi tidak bisa terbayar dua kali.
//
// Saat user menekan "Bayar Sekarang", script memanggil POST /backend/confirm.php
// untuk menyelesaikan transaksi dan menambah poin.

const API_BASE =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
  resolveBackendBase();

function resolveBackendBase(): string {
  const { origin, pathname } = window.location;
  const idx = pathname.toLowerCase().indexOf("/jagocv---salman");
  if (idx >= 0) {
    return `${origin}${pathname.slice(0, idx)}/jagoCV---Salman/backend`;
  }
  return `${origin}/backend`;
}

/** Ubah path app ("/") menjadi URL absolut yang benar. */
function toAbsoluteAppUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const { origin, pathname } = window.location;
  const idx = pathname.toLowerCase().indexOf("/jagocv---salman");
  const base = idx >= 0 ? pathname.slice(0, idx) + "/jagoCV---Salman" : "";
  return `${origin}${base}${url}`;
}

const TOKEN_KEY = "jagocv_token";
const PAYMENT_DONE_FLAG = "jagocv_payment_done";

let paymentDone = false;

// ── Isi ringkasan transaksi ──────────────────────────────────────────
function fillSummary(paymentRef: string): void {
  const params = new URLSearchParams(window.location.search);
  const pkgName = params.get("package") ?? "—";
  const pkgPoints = params.get("points") ?? "—";
  const pkgAmount = Number(params.get("amount") ?? "0");
  const pkgMethod = (params.get("method") ?? "qris").toUpperCase();

  document.getElementById("pay-package")!.textContent = pkgName;
  document.getElementById("pay-points")!.textContent = `${pkgPoints} poin`;
  document.getElementById("pay-method")!.textContent = pkgMethod;
  document.getElementById("pay-ref")!.textContent = paymentRef || "—";
  document.getElementById("pay-amount")!.textContent = `Rp ${pkgAmount.toLocaleString("id-ID")}`;
}

// ── Status "sudah diproses" (pengganti tombol Bayar) ─────────────────
function showAlreadyProcessed(): void {
  const detail = document.getElementById("pay-detail")!;
  const result = document.getElementById("pay-result")!;
  const badge = document.getElementById("pay-status-badge")!;
  const title = document.getElementById("pay-result-title")!;
  const desc = document.getElementById("pay-result-desc")!;
  const pointsEl = document.getElementById("pay-result-points")!;

  detail.classList.add("hidden");
  result.classList.remove("hidden");
  badge.textContent = "Selesai";
  badge.className =
    "ml-auto px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wide";
  title.textContent = "Transaksi Sudah Diproses";
  desc.textContent =
    "Transaksi ini sudah selesai dan tidak bisa dibuka kembali. Silakan buat top up baru dari halaman Pricing.";
  pointsEl.textContent = "—";
}

// ── Bayar sekarang / batalkan ────────────────────────────────────────
function setLoading(loading: boolean): void {
  const btnPay = document.getElementById("btn-pay-now") as HTMLButtonElement;
  const btnCancel = document.getElementById("btn-pay-cancel") as HTMLButtonElement;
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

async function finishPayment(paymentRef: string, status: "success" | "failed"): Promise<void> {
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
        markPaymentDone();
        showResult(false, "Pembayaran dibatalkan. Anda bisa mencoba lagi kapan saja.");
        return;
      }
      const balance = data.points ?? 0;
      // Simpan saldo terbaru agar chip poin langsung benar setelah kembali.
      localStorage.setItem("jagocv_points_cache", String(balance));
      markPaymentDone();
      showResult(true, `Pembayaran berhasil! Poin Anda bertambah.`, balance);
    } else {
      showResult(false, data?.message ?? "Pembayaran gagal diproses.");
    }
  } catch {
    showResult(
      false,
      "Tidak dapat menghubungi /backend/confirm.php. Pastikan Apache menyala, lalu buka /backend/ping.php untuk diagnosa.",
    );
  } finally {
    setLoading(false);
  }
}

/** Tandai transaksi selesai: tombol Bayar tidak boleh muncul lagi. */
function markPaymentDone(): void {
  paymentDone = true;
  try {
    sessionStorage.setItem(PAYMENT_DONE_FLAG, "1");
  } catch {
    /* storage diblokir — guard in-memory tetap aktif */
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

// ── Init ─────────────────────────────────────────────────────────────
function boot(): void {
  const params = new URLSearchParams(window.location.search);
  const paymentRef = params.get("ref") ?? "";

  // Pengaman 1: halaman hanya boleh dibuka dari redirect checkout yang
  // sah (st=1). Back dari halaman lain / link manual tanpa data transaksi
  // → ganti halaman dengan aplikasi (replace: tidak menambah history).
  if (!paymentRef || params.get("st") !== "1") {
    window.location.replace(toAbsoluteAppUrl("/"));
    return;
  }

  fillSummary(paymentRef);

  // Tombol "Kembali ke jagoCV" memakai replace agar tidak menambah
  // history entry baru (konsisten dengan pengaman navigasi di atas).
  const btnBack = document.getElementById("btn-pay-back") as HTMLAnchorElement | null;
  if (btnBack) {
    const appUrl = toAbsoluteAppUrl("/");
    btnBack.setAttribute("href", appUrl);
    btnBack.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.replace(appUrl);
    });
  }

  // Pengaman 2: transaksi yang sudah diproses (berhasil/gagal) tidak
  // boleh ditawarkan ulang. Bila halaman ini kebuka lagi (mis. lewat Back),
  // tampilkan status "sudah diproses" alih-alih tombol Bayar.
  try {
    if (sessionStorage.getItem(PAYMENT_DONE_FLAG) === "1") {
      paymentDone = true;
      sessionStorage.removeItem(PAYMENT_DONE_FLAG);
    }
  } catch {
    /* storage diblokir — abaikan */
  }

  // Bila user bernavigasi (Back/Forward) di dalam halaman ini setelah
  // transaksi selesai, pastikan tombol Bayar tidak pernah tampil lagi.
  window.addEventListener("popstate", () => {
    if (paymentDone) showAlreadyProcessed();
  });

  if (paymentDone) {
    showAlreadyProcessed();
    return;
  }

  const btnPay = document.getElementById("btn-pay-now") as HTMLButtonElement;
  const btnCancel = document.getElementById("btn-pay-cancel") as HTMLButtonElement;

  btnPay.addEventListener("click", async () => {
    setLoading(true);
    await finishPayment(paymentRef, "success");
  });

  btnCancel.addEventListener("click", async () => {
    setLoading(true);
    await finishPayment(paymentRef, "failed");
  });
}

boot();
