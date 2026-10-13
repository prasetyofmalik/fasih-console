/* ============================================================================
 * Contoh FASIH.setComment — satu dataKey pada satu record.
 *
 *   mode: 'append'  (default) -> TAMBAH bubble baru di riwayat comment.json
 *   mode: 'replace'           -> TIMPA riwayat dataKey itu jadi satu bubble
 *
 * Jalankan dari DevTools Console pada tab FASIH yang sudah login, setelah
 * await FASIH.init() (untuk validasi dataKey). Kembalikan nilainya bisa
 * dicek di console: nDitambah / nDihapus / jumlahKomentar.
 * ==========================================================================*/

const ID = '1db81000-47bf-433e-8258-739edc6e331b';
const DATAKEY = 'nilai_pendapatan#1';

/* --- 0) CEK PENULIS KOMENTAR ----------------------------------------------
 * sender diisi otomatis dengan nama akun SSO yang sedang login (dibaca dari
 * storage/cookie/DOM). Cek dulu; kalau hasilnya "(belum terdeteksi)", set
 * manual sekali saja lewat FASIH.setUser('username.sso').                  */
FASIH.whoami();
// FASIH.setUser('gilang.prasetyo');   // hanya bila whoami() belum terdeteksi

/* --- 1) APPEND (default) ---------------------------------------------------
 * Menambah komentar baru; komentar lama tetap ada sehingga di web tampil
 * berderet seperti bubble chat. Kalau teksnya sudah ada, dilewati (dedupe).
 * Contoh di bawah: dry run dulu (tidak mengirim apa pun).               */
await FASIH.setComment(ID, DATAKEY, '#DC_01', { dryRun: true });

// lalu jalankan sungguhan:
// await FASIH.setComment(ID, DATAKEY, '#DC_01', { dryRun: false });

/* --- 2) APPEND mentah tanpa dedupe ---------------------------------------
 * Selalu push, walau teks sama sudah pernah ada (bubble bisa menumpuk).
 * await FASIH.setComment(ID, DATAKEY, '#DC_01', { dedupe: false, dryRun: false });
 */

/* --- 3) REPLACE -----------------------------------------------------------
 * Menghapus SELURUH riwayat komentar dataKey ini lalu mengisinya dengan satu
 * komentar baru (di web jadi satu bubble). DataKey lain tidak tersentuh.
 * Kalau isinya sudah persis satu komentar yang sama, submit dilewati.    */
// await FASIH.setComment(ID, DATAKEY, '#DC_02', { mode: 'replace', dryRun: true });
// await FASIH.setComment(ID, DATAKEY, '#DC_02', { mode: 'replace', dryRun: false });

/* --- 4) Menimpa penulis tertentu -----------------------------------------
 * author (opsional) menimpa nama akun login untuk panggilan ini saja.
 * Bila dikosongkan, sender = nama akun login -> sender lama -> current_user.
 * await FASIH.setComment(ID, DATAKEY, '#DC_02', { author: 'budi', dryRun: false });
 */
