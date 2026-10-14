/* ============================================================================
 * Contoh FASIH.updateBatch — banyak record sekaligus.
 *
 *   rows: [{ assignmentId, values:{...}, columns?:{data1:'...'} }]
 *     atau  FASIH.updateBatch(ids, { values:{...} })  untuk nilai sama ke semua.
 *   opts: { dryRun, delayMs, stopOnError, values }
 *
 * Loop-nya berurutan: 1 record -> jeda delayMs -> record berikutnya. Error pada
 * satu record TIDAK menghentikan yang lain (kecuali stopOnError:true); baris
 * itu masuk hasil sebagai { ok:false, error }. Karena itu backup dulu.
 *
 * SATU BARIS SATU RECORD — kalau assignmentId yang sama muncul beberapa kali,
 * itu jadi beberapa submit berturut-turut dan record itu naik versi beberapa
 * kali. Gabungkan dulu per assignmentId bila memang mau satu submit.
 *
 * Update ini menulis DOKUMEN (data.json) dan MELEWATI seluruh validasi FormGear
 * di sisi klien. Selalu dry run -> cek -> backup -> live -> buka di UI.
 * ==========================================================================*/

const DAFTAR = [
  { assignmentId: 'cdf43350-cb05-4eef-8c8e-195ec55c3d73', values: { 'hubungan#2': '4', ada_keluarga: '1' } },
  { assignmentId: '1702c3f8-b667-4910-ab23-38feb4f41938', values: { 'hubungan#2': '4', ada_keluarga: '1' } },
  { assignmentId: '0f5cee72-10b5-47d3-ba8f-19b521d785ee', values: { 'hubungan#2': '3', ada_keluarga: '1' } },
  { assignmentId: '8df88f92-ef71-4879-a259-4e0bad442c16', values: { 'hubungan#2': '4', ada_keluarga: '1' } },
  { assignmentId: '9df95496-ce82-402d-be33-dfaaf3aeddec', values: { 'hubungan#2': '3', ada_keluarga: '1' } },
];

/* --- 1) PERSIAPAN + BACKUP ------------------------------------------------
 * init() wajib: tanpa skema, kode opsi tidak bisa diterjemahkan ke bentuk
 * {label,value} dan setAnswer() akan menolak menuliskannya.                   */
await FASIH.init({ assignmentId: DAFTAR[0].assignmentId });
FASIH.find('hubungan');                 // sanity check ejaan dataKey
const CADANGAN = await FASIH.backup(DAFTAR.map((d) => d.assignmentId));

/* --- 2) DRY RUN -----------------------------------------------------------
 * Tidak ada yang dikirim; hanya menghitung perubahan per record. Jalankan
 * lebih dulu dan periksa tabel di bawah sebelum lanjut ke live.             */
const HASIL = await FASIH.updateBatch(DAFTAR, { dryRun: true, delayMs: 1500 });

console.table(HASIL.map((r, i) => ({
  no: i + 1,
  assignmentId: r.assignmentId,
  kode: r.code,
  perubahan: r.nChanges,
  dariVersi: r.version,
  hasil: r.ok === false ? 'GAGAL' : r.dryRun ? 'dry-run' : 'ok',
  error: r.error || '',
})));

// Rincian field yang berubah pada satu record (dry run maupun live):
if (HASIL[0] && HASIL[0].changes && HASIL[0].changes.length) console.table(HASIL[0].changes);

/* --- 3) LIVE --------------------------------------------------------------
 * Nilai sama persis dengan dry run, tambahkan { dryRun: false }. */
// await FASIH.updateBatch(DAFTAR, { dryRun: false, delayMs: 1500 });

/* --- 4) NILAI YANG SAMA UNTUK SEMUA RECORD --------------------------------
 * Boleh juga kirim array id biasa; nilainya diambil dari opts.values.        */
await FASIH.updateBatch(DAFTAR.map((d) => d.assignmentId), {
  values: { ada_keluarga: '1' },
  dryRun: true,
});

/* --- 5) CAMPURAN: GLOBAL + PER BARIS --------------------------------------
 * Baris yang punya `values` sendiri memakai miliknya; opts.values hanya
 * menjadi nilai bawaan.                                                     */
await FASIH.updateBatch([
  { assignmentId: 'cdf43350-cb05-4eef-8c8e-195ec55c3d73', values: { ada_keluarga: '1', no_banr: '0001' } },
  { assignmentId: '1702c3f8-b667-4910-ab23-38feb4f41938' },              // pakai bawaan
  { assignmentId: '0f5cee72-10b5-47d3-ba8f-19b521d785ee', values: { ada_keluarga: '9' } },
], { values: { ada_keluarga: '1', banr: true }, dryRun: true });

/* --- 6) NILAI BERAGAM: TEKS, ANGKA, BOOLEAN, PILIHAN, ROSTER, GEO ----------
 * values mengikuti aturan yang sama seperti FASIH.update().                  */
await FASIH.updateBatch([
  { assignmentId: 'cdf43350-cb05-4eef-8c8e-195ec55c3d73',
    values: { luas_lantai: 36, jns_lantai: '1', jumlah_kulkas: 2, anomali_admin: true } },
  { assignmentId: '1702c3f8-b667-4910-ab23-38feb4f41938',
    values: { 'nama_dtsen#1': 'BUDI SANTOSO', 'nama_dtsen#2': 'SITI AMINAH' } },
  { assignmentId: '0f5cee72-10b5-47d3-ba8f-19b521d785ee',
    values: { status_kepemilikan: FASIH.raw([{ label: '5. Lainnya', value: '5', open: 'Sewa' }]) } },
  { assignmentId: '8df88f92-ef71-4879-a259-4e0bad442c16',
    values: { geotag: FASIH.geotag(-0.49051, 117.140465, 5) } },
  { assignmentId: '9df95496-ce82-402d-be33-dfaaf3aeddec',
    values: { ada_keluarga: '1', kode_bang: '3' },
    columns: { data1: 'SCM-EDIT' },                    // kolom data1..data10 per record
  },
], { dryRun: true });

/* --- 7) MENGHENTIKAN PADA ERROR PERTAMA ------------------------------------
 * Default: error dicatat dan loop lanjut. stopOnError:true berguna ketika
 * seluruh batch harus berhenti begitu ada satu record yang gagal.            */
// await FASIH.updateBatch(DAFTAR, { dryRun: false, delayMs: 3000, stopOnError: true });

/* --- 8) KEMBALIKAN --------------------------------------------------------
 * Pakai CADANGAN dari bagian 1 (restore juga punya jeda & error handling).   */
await FASIH.restore(CADANGAN, { dryRun: true });                        // dry run
// await FASIH.restore(CADANGAN, { dryRun: false, delayMs: 1200 });      // live
