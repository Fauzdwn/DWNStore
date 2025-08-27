// !!! PERINGATAN KEAMANAN KRITIS !!!
//
// Token API di bawah ini SANGAT SENSITIF.
// Mengekspos token ini di sisi klien (dalam kode JavaScript di browser)
// sangat berbahaya. Siapapun dapat menemukan dan menggunakan token ini untuk
// mengirim pesan melalui akun Fonnte Anda, yang dapat menyebabkan penyalahgunaan
// dan biaya tak terduga.
//
// SOLUSI YANG BENAR:
// Pindahkan logika pengiriman pesan ini ke lingkungan backend yang aman,
// seperti Firebase Cloud Function, AWS Lambda, atau server Anda sendiri.
// Klien (browser) harus memanggil fungsi backend Anda, dan fungsi backend
// itulah yang akan melakukan panggilan ke API Fonnte dengan aman menggunakan token ini.
//
// JANGAN PERNAH MENINGGALKAN TOKEN INI DI KODE FRONTEND DALAM LINGKUNGAN PRODUKSI.

const FONNTE_API_TOKEN = 'qss59i4kqEUuEpXbqkKm';
