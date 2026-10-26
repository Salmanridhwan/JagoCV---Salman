/** Helper format admin — dipindah/pattern dari src/js/views/point-history.ts (Bagian 2). */

const nf = new Intl.NumberFormat("id-ID");

/** Angka dengan pemisah ribuan id-ID: 24.850 */
export function formatAngka(n: number): string {
  return nf.format(Math.round(n));
}

/** Rupiah: Rp 148.500.000 */
export function formatRupiah(n: number): string {
  return `Rp${nf.format(Math.round(n))}`;
}

/** Persen dengan tanda +/−: +12,5% */
export function formatPersen(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Tanggal pendek: 12 Okt 2026 */
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Waktu relatif gaya desain: "Hari ini 14:30 WIB" / "Kemarin 13:05 WIB" / "5 Okt 09:12 WIB" */
export function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(iso);

  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`;
  const now = new Date();
  const startOfDay = (x: Date): number =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();

  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return `Hari ini ${time}`;
  if (diffDays === 1) return `Kemarin ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${time.slice(0, 5)}`;
}

/** Inisial untuk avatar lingkaran: Salman Nugroho → SN */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Chip ID publik: users.id → USR-#### (desain patokan; tanpa kolom DB baru). */
export function usrId(id: number): string {
  return `USR-${String(id).padStart(4, "0")}`;
}
