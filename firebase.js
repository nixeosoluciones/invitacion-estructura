/* ============================================================
   firebase.js — Configuración e inicialización de Firebase
   ------------------------------------------------------------
   ¿DÓNDE COLOCAR TU CONFIGURACIÓN REAL?
   1) Entra a https://console.firebase.google.com
   2) Abre tu proyecto (ej. "fiestabellybeto") → ⚙️ → "Configuración del proyecto"
   3) En "Tus apps" → app Web → copia el objeto firebaseConfig
   4) Pégalo ABAJO donde dice firebaseConfig (reemplaza los valores).

   La configuración abajo YA trae tu proyecto fiestabellybeto
   (la tomé de tu archivo firebase.txt). Si creas otro proyecto,
   solo reemplaza esos valores. No hay secretos privados aquí:
   la apiKey del frontend es pública por diseño; protege con
   Reglas de Firestore (ver README).
   ============================================================ */

// ★★★ EDITA AQUÍ TU CONFIGURACIÓN DE FIREBASE ★★★
const firebaseConfig = {
  apiKey: "AIzaSyDgv583Y8lGi50wUXGSbfqaGLwvm9ZTXH8",
  authDomain: "fiestabellybeto.firebaseapp.com",
  projectId: "fiestabellybeto",
  storageBucket: "fiestabellybeto.firebasestorage.app",
  messagingSenderId: "799589094771",
  appId: "1:799589094771:web:755560669b14ffd8c16106"
};

// Inicializa Firebase (SDK compat cargado en index.html).
// Si el SDK no cargó (sin internet), el sitio sigue funcionando
// y las confirmaciones se guardan en modo local (ver script.js).
let db = null;
try {
  if (typeof firebase !== "undefined" && firebaseConfig.projectId !== "TU_PROJECT_ID") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("✅ Firebase conectado:", firebaseConfig.projectId);
  } else {
    console.warn("⚠️ Firebase no configurado: se usará modo local.");
  }
} catch (e) {
  console.warn("⚠️ No se pudo iniciar Firebase, modo local activado.", e);
  db = null;
}
