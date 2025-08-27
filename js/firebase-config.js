// PERINGATAN KEAMANAN: Kunci-kunci ini dapat diakses secara publik di sisi klien.
// Untuk keamanan produksi, sangat disarankan untuk menggunakan Firebase App Check
// untuk memastikan permintaan berasal dari aplikasi Anda yang sah, dan gunakan
// Aturan Keamanan Firebase (Firebase Security Rules) yang ketat untuk melindungi data Anda.
// Untuk otentikasi admin, gunakan Firebase Authentication, bukan pengecekan kredensial di sisi klien.

const firebaseConfig = {
  apiKey: "AIzaSyCN2Qn_VUE2w45lKq0rXy2CzJ7oZXk_f7s",
  authDomain: "dwnprojeck.firebaseapp.com",
  databaseURL: "https://dwnprojeck-default-rtdb.firebaseio.com",
  projectId: "dwnprojeck",
  storageBucket: "dwnprojeck.firebasestorage.app",
  messagingSenderId: "838975714627",
  appId: "1:838975714627:web:9bcfa62ed3fc8dbca56bf6",
  measurementId: "G-LY0J0CQ9XR"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
