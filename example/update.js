/* ============================================================================
 * Contoh FASIH.update — satu record, beberapa field sekaligus.
 *
 *   await FASIH.update(ID, values)                  // dry run (default)
 *   await FASIH.update(ID, values, { dryRun:false }) // live
 *
 * Jalankan dari DevTools Console pada tab FASIH yang sudah login, setelah
 * await FASIH.init() — tanpa skema, coerce() tidak bisa menerjemahkan kode
 * pilihan ke bentuk {label,value} sehingga setAnswer() menolak menuliskannya.
 *
 * Alur aman: backup -> dry run -> baca tabel changes -> live -> buka di UI.
 * Nilai balik selalu punya: assignmentId, code, version, nChanges, changes.
 * (changes = [{ dataKey, dari, ke }] — belum dicetak otomatis, cetak sendiri)
 * ==========================================================================*/

const ID = '1db81000-47bf-433e-8258-739edc6e331b';

/* --- 0) PERSIAPAN ---------------------------------------------------------
 * init() memuat skema template (wajib untuk field bertipe pilihan).
 * schema() menampilkan tipe + daftar opsi valid untuk satu dataKey.
 * Cari dataKey yang benar dengan find('kata kunci') bila tidak yakin.        */
await FASIH.init({ assignmentId: ID });
FASIH.schema('hubungan');          // -> { type, kind, options: [...] }
FASIH.find('hubungan');            // cari dari label, bukan dari dataKey
FASIH.rows(ID, 'hubungan');        // isi baris roster yang sekarang terisi
// await FASIH.dump(ID);            // semua field terisi di record ini

/* --- 1) BACKUP DULU -------------------------------------------------------
 * Unduh .json berisi data, comment, dan kolom data1..data10.
 * Ini yang dipakai FASIH.restore() kalau hasilnya perlu dikembalikan.       */
const CADANGAN = await FASIH.backup([ID]);

/* --- 2) DRY RUN (default) -------------------------------------------------
 * Tidak mengirim apa pun ke server; hanya menghitung tabel perubahan.
 * WAJIB dijalankan dulu sebelum live: kalau ada dataKey yang salah eja atau
 * nilai yang tidak cocok dengan opsinya, bagian 3 akan menunjukkannya.       */
const dry = await FASIH.update(ID, {
  'hubungan#2': '4',                          // roster -> kode opsi "4"
  ada_keluarga: '1',
});
console.table(dry.changes);                   // dataKey | dari | ke
console.log(`${dry.nChanges} perubahan, versi ${dry.version}`);

/* --- 3) LIVE --------------------------------------------------------------
 * Nilai yang sama persis dengan dry run, tambahkan { dryRun: false }.       */
// await FASIH.update(ID, {
//   'hubungan#2': '4',
//   ada_keluarga: '1',
// }, { dryRun: false });

/* --- 4) BENTUK NILAI YANG DITERIMA ---------------------------------------
 *   teks      : string apa adanya            -> { catatan:'rumah kosong' }
 *   angka     : number, diketik number        -> { luas_lantai: 36 }
 *   boolean   : apa pun -> true/false         -> { anomali_admin: true }
 *   pilihan   : KODE opsinya (string/num),    -> { kode_bang: '3' }
 *               bukan teks label
 *   multi     : array kode                   -> { pilihan: ['2','9'] }
 *   roster    : pakai sufiks #indeks         -> { 'nama_dtsen#1': 'BUDI' }
 *
 * Kode opsi yang benar bisa dilihat di FASIH.schema('kode_bang').options.    */
await FASIH.update(ID, {
  luas_lantai: 36,
  jns_lantai: '1',
  jumlah_kulkas: 2,
  anomali_admin: true,
  'nama_dtsen#1': 'BUDI SANTOSO',
});

/* --- 5) PILIHAN + ISIAN "LAINNYA" -----------------------------------------
 * Bentukkan sendiri dengan { value, open } lalu bungkus FASIH.raw().        */
await FASIH.update(ID, {
  status_kepemilikan: FASIH.raw([{ label: '5. Lainnya', value: '5', open: 'Sewa' }]),
});

/* --- 6) NILAI MENTAH (melewati terjemahan ke opsi) ------------------------
 * Kalau nilai sudah berbentuk objek lengkap {label,value} yang TIDAK ada di
 * template (mis. hasil hitung ulang sendiri), bungkus dengan FASIH.raw()
 * supaya dipasang apa adanya — bukan dicari ke daftar opsi.                  */
await FASIH.update(ID, {
  ada_keluarga: FASIH.raw([{ label: '1. Ditemukan', value: '1', open: false }]),
  kode_bang: FASIH.raw([{ label: '3. Bangunan Tempat Tinggal', value: '3', open: false }]),
});

/* --- 7) GEOTAG ------------------------------------------------------------
 * Bentuknya 5 slot berurutan; geotag() sudah menyusunnya dengan benar.      */
await FASIH.update(ID, { geotag: FASIH.geotag(-0.49051, 117.140465, 5) });
// atau ringkas:  await FASIH.setGeotag(ID, -0.49051, 117.140465, { dryRun: false });

/* --- 8) MENGOSONGKAN FIELD -----------------------------------------------
 * null melakukan set answer = null (barisnya tetap ada di answers).
 * Untuk benar-benar MENGHAPUS baris jawaban, pakai patch() + splice:
 *
 *   await FASIH.patch(ID, (doc) => {
 *     const i = doc.answers.findIndex((a) => a.dataKey === 'total_pengeluaran');
 *     if (i >= 0) doc.answers.splice(i, 1);
 *   }, { dryRun: false });
 * =========================================================================*/

/* --- 9) OVERRIDE KOLOM ----------------------------------------------------
 * Kolom data1..data10 ikut terkirim apa adanya; isi per kolom kalau perlu
 * menandai asal data (mis. kolom sumber).
 * await FASIH.update(ID, { ada_keluarga: '1' }, {
 *   dryRun: false,
 *   columns: { data1: 'SCM-EDIT' },
 * });                                                                       */

/* --- 10) KEMBALIKAN -------------------------------------------------------
 * Pakai hasil backup() pada bagian 1. Default dry run juga — tambahkan
 * { dryRun: false } setelah, lalu periksa hasilnya.                          */
await FASIH.restore(CADANGAN);                                     // dry run
// await FASIH.restore(CADANGAN, { dryRun: false, delayMs: 1200 }); // live
