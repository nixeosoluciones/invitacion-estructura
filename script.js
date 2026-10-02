/* ============================================================
   script.js — Lógica de la invitación (JS puro, sin frameworks)
   Secciones:
   1. CONFIGURACIÓN EDITABLE (edita aquí todo tu evento)
   2. Flujo Sobre → Carta → Fiesta (referencia Birthday-V2)
   3. Música, globos, confeti y animaciones
   4. Contador regresivo
   5. Calendario (Google / Apple / Outlook)
   6. Mesa de regalos (mensaje para entregar en el evento)
   7. Formulario + guardado en Firebase
   ============================================================ */

/* ================= 1. CONFIGURACIÓN EDITABLE ================= */

// ---- Datos del evento (centralizados) ----
const evento = {
  titulo: "Cumpleaños 3 de Victoria Palacios Nava",
  descripcion: "Acompáñanos a celebrar los 3 años de Victoria. ¡Habrá fiesta, música y sorpresas!",
  ubicacionTexto: "Ver ubicación en Google Maps",
  direccion: "Av. Abraham Lincoln 8112, col. Plutarco Elías Calles, Monterrey NL.", // ← dirección del salón
  mapsURL: "https://maps.app.goo.gl/FtVZk4571nZMHTR9A?g_st=aw",
  fechaISO: "2026-10-24",      // Año-Mes-Día del cumpleaños
  horaFin: "20:00",            // ← EDITA: hora de finalización (para el calendario)
  duracionHoras: 2             // se usa si no quieres calcular horaFin
};

// ✅ HORA DEL EVENTO CONFIRMADA: 24 de octubre, 3:00 pm (Show 4:00 pm).
// El calendario usa HORA_EVENTO como hora de inicio.
const HORA_EVENTO = "15:00";       // ← EDITA LA HORA AQUÍ (formato 24h "HH:MM")
const HORA_CONFIRMADA = true;      // ← ponla en true cuando la hora sea oficial

// Fecha/hora exacta del evento para el contador (usa HORA_EVENTO).
const fechaEvento = new Date(`${evento.fechaISO}T${HORA_EVENTO}:00`);

// ---- Invitados iniciales y límites ----
// NOTA: "José Garza" e "Irene" se conservan aquí como invitados iniciales
// (dato de referencia del evento), pero NO se precargan dentro de los inputs:
// el campo de texto inicia vacío y el usuario escribe cada nombre.
const listaInicialInvitados = ["José Garza", "Irene"]; // ← dato inicial (no precargar en inputs)
const MAX_INVITADOS = 10; // número máximo de filas de invitados adultos

/* ============ 2. FLUJO SOBRE → CARTA → FIESTA ============ */
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const envelopeContainer = document.getElementById("envelopeContainer");
const letterContainer = document.getElementById("letterContainer");
const unfoldButton = document.getElementById("unfold-button");

function abrirSobre() {
  if (!envelopeContainer || envelopeContainer.classList.contains("open")) return;
  envelopeContainer.classList.add("open");
  setTimeout(() => {
    step1.classList.remove("active");
    step2.classList.add("active");
    setTimeout(() => letterContainer && letterContainer.classList.add("show"), 100);
  }, 700); // espera la animación de la solapa (como en Birthday-V2)
}

if (envelopeContainer) {
  envelopeContainer.addEventListener("click", abrirSobre);
  envelopeContainer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirSobre(); }
  });
}

if (unfoldButton) {
  unfoldButton.addEventListener("click", () => {
    step2.classList.remove("active");
    step3.classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    startFinalAnimations();
    intentarReproducirMusica(); // la música solo puede iniciar tras un gesto del usuario
    activarReveal();            // las secciones aparecen con animación al hacer scroll
  });
}

function startFinalAnimations() {
  createBalloons(15);
  lanzarConfeti(180);
}

// Globos flotantes (como en Birthday-V2, con colores de Bely y Beto)
function createBalloons(count) {
  const cont = document.getElementById("globos");
  if (!cont) return;
  const colores = ["#ff2e88", "#ff6a00", "#00b3c6", "#7c3aed", "#ff3b3b", "#22c55e"];
  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    b.className = "balloon";
    b.style.left = `${Math.random() * 100}vw`;
    b.style.animationDuration = `${Math.random() * 6 + 8}s`;
    b.style.animationDelay = `${Math.random() * 5}s`;
    b.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
    cont.appendChild(b);
  }
}

/* ================= 3. MÚSICA DESDE YOUTUBE (solo audio, una pista) ================
   Video: https://www.youtube.com/watch?v=hSZbeDDWi1Y (inicia 0:03)
   El audio se transmite desde YouTube (no gasta ancho de banda de Netlify).
   El video queda oculto: solo se escucha el audio.
   Para cambiar la canción edita PISTA (ID = lo que va después de "v=",
   inicio = segundo donde empieza).
   Al abrir la fiesta suena la pista 1 por defecto. Un solo botón Pausar/Seguir
   detiene o reanuda la reproducción. Sin controles de sonido visibles.
   Los navegadores bloquean el autoplay con sonido, por eso la música inicia
   DESPUÉS de que el usuario abre la fiesta (gesto válido). */
const PISTA = { id: "hSZbeDDWi1Y", inicio: 3 };   // ← EDITA LA CANCIÓN AQUÍ
const btnPausarMusica = document.getElementById("btnPausarMusica");
let musicaSonando = false;
let pistaIniciada = false; // false = aún no suena nada
let ytListo = false;
let ytPlayer = null;
let pendienteInicio = false; // se pidió sonar antes de que cargue la API

function pintarBotonMusica() {
  if (btnPausarMusica) btnPausarMusica.textContent = musicaSonando ? "⏸️ Pausar" : "▶️ Seguir";
}

// Carga la API de YouTube (https://developers.google.com/youtube/iframe_api_reference)
(function cargarAPIYouTube() {
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
})();

// YouTube llama a esta función global cuando la API está lista.
window.onYouTubeIframeAPIReady = function () {
  if (typeof YT === "undefined" || !YT.Player) return;
  ytPlayer = new YT.Player("ytPlayer", {
    width: "1",
    height: "1",
    videoId: PISTA.id,
    playerVars: { autoplay: 0, controls: 0, disablekb: 1, rel: 0 },
    events: {
      onReady: () => {
        ytListo = true;
        if (pendienteInicio) { pendienteInicio = false; sonarPista(); }
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          sonarPista(); // al terminar, repite la misma pista desde el inicio
          return;
        }
        musicaSonando = (e.data === YT.PlayerState.PLAYING);
        pintarBotonMusica();
      },
      onError: () => {
        ytListo = false;
        musicaSonando = false;
        pintarBotonMusica();
      }
    }
  });
};

// Reproduce la pista 1 desde su segundo de inicio (siempre la misma).
function sonarPista() {
  pistaIniciada = true;
  if (ytListo && ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById({ videoId: PISTA.id, startSeconds: PISTA.inicio });
  } else {
    pendienteInicio = true; // la API aún carga: suena en cuanto esté lista
  }
}

function intentarReproducirMusica() {
  if (musicaSonando || pistaIniciada) return;
  sonarPista(); // se llama desde "Abrir mi fiesta": gesto válido, siempre pista 1
}

if (btnPausarMusica) {
  pintarBotonMusica();
  btnPausarMusica.addEventListener("click", () => {
    if (musicaSonando) {
      if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
    } else if (pistaIniciada && ytListo && ytPlayer && ytPlayer.playVideo) {
      ytPlayer.playVideo(); // reanuda donde se pausó
    } else {
      sonarPista(); // aún no sonaba nada: inicia pista 1
    }
  });
}

/* ================= CONFETI (canvas, ligero) ================= */
const canvas = document.getElementById("confetiCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let particulas = [];

function dimensionarCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", dimensionarCanvas);
dimensionarCanvas();

function lanzarConfeti(cantidad = 150) {
  if (!ctx || !canvas) return;
  dimensionarCanvas();
  const colores = ["#ff2e88", "#ff6a00", "#00b3c6", "#7c3aed", "#ff3b3b", "#22c55e", "#ffffff"];
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colores[Math.floor(Math.random() * colores.length)],
      vy: 2 + Math.random() * 3,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2
    });
  }
  if (particulas.length && !lanzarConfeti.animando) {
    lanzarConfeti.animando = true;
    requestAnimationFrame(pintarConfeti);
  }
}
function pintarConfeti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particulas.forEach((p) => {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
  particulas = particulas.filter((p) => p.y < canvas.height + 30);
  if (particulas.length) requestAnimationFrame(pintarConfeti);
  else { lanzarConfeti.animando = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

/* ================= 4. CONTADOR REGRESIVO ================= */
const elDias = document.getElementById("cd-dias");
const elHoras = document.getElementById("cd-horas");
const elMin = document.getElementById("cd-min");
const elSeg = document.getElementById("cd-seg");
const mensajeContador = document.getElementById("mensajeContador");
const itemSeg = elSeg ? elSeg.closest(".contador-item") : null;

function pad(n) { return String(n).padStart(2, "0"); }

function actualizarContador() {
  if (!elDias) return;
  const ahora = new Date();
  const diff = fechaEvento - ahora;
  if (isNaN(fechaEvento.getTime())) {
    if (mensajeContador) mensajeContador.textContent = "⚠️ Revisa la fecha del evento en script.js.";
    return;
  }
  if (diff <= 0) {
    elDias.textContent = "00"; elHoras.textContent = "00";
    elMin.textContent = "00"; elSeg.textContent = "00";
    if (mensajeContador) mensajeContador.textContent = "🎉 ¡Hoy es la fiesta! Te esperamos para celebrar a Victoria. 🎂";
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  elDias.textContent = pad(d); elHoras.textContent = pad(h);
  elMin.textContent = pad(m); elSeg.textContent = pad(s);
  if (itemSeg) { itemSeg.classList.remove("pop"); void itemSeg.offsetWidth; itemSeg.classList.add("pop"); }
  if (mensajeContador) mensajeContador.textContent = "";
}
actualizarContador();
setInterval(actualizarContador, 1000);

// Muestra la hora confirmada en formato 12h (ej. "3:00 pm").
(function mostrarHora() {
  const el = document.getElementById("horaEventoTexto");
  if (!el) return;
  if (!HORA_CONFIRMADA) { el.textContent = "[HORA DEL EVENTO]"; return; }
  const [h, m] = HORA_EVENTO.split(":").map(Number);
  const suf = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  el.textContent = `${h12}:${String(m).padStart(2, "0")} ${suf}`;
})();

/* ================= 5. AGREGAR AL CALENDARIO ================= */
function formatoFechaICS(fecha) {
  // YYYYMMDDTHHMMSS (hora local, sin zona — compatible con Apple/Outlook/Google)
  const p = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}${p(fecha.getMonth() + 1)}${p(fecha.getDate())}T${p(fecha.getHours())}${p(fecha.getMinutes())}00`;
}
function fechaFinEvento() {
  // Usa horaFin si es válida; si no, suma duracionHoras.
  const [hf, mf] = String(evento.horaFin || "").split(":").map(Number);
  if (hf >= 0 && hf < 24) {
    const f = new Date(fechaEvento);
    f.setHours(hf, mf || 0, 0, 0);
    if (f > fechaEvento) return f;
  }
  return new Date(fechaEvento.getTime() + (evento.duracionHoras || 2) * 3600000);
}
function textoFechaGoogle(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

const btnG = document.getElementById("btnGoogleCal");
if (btnG) btnG.addEventListener("click", () => {
  const fin = fechaFinEvento();
  const url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent(evento.titulo)
    + "&dates=" + textoFechaGoogle(fechaEvento) + "/" + textoFechaGoogle(fin)
    + "&details=" + encodeURIComponent(evento.descripcion + " " + evento.mapsURL)
    + "&location=" + encodeURIComponent(evento.direccion);
  window.open(url, "_blank", "noopener");
});

const btnO = document.getElementById("btnOutlookCal");
if (btnO) btnO.addEventListener("click", () => {
  const fin = fechaFinEvento();
  const fmt = (d) => d.toISOString().slice(0, 19); // Outlook acepta ISO
  const url = "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent"
    + "&subject=" + encodeURIComponent(evento.titulo)
    + "&startdt=" + encodeURIComponent(fmt(fechaEvento))
    + "&enddt=" + encodeURIComponent(fmt(fin))
    + "&body=" + encodeURIComponent(evento.descripcion + " " + evento.mapsURL)
    + "&location=" + encodeURIComponent(evento.direccion);
  window.open(url, "_blank", "noopener");
});

const btnA = document.getElementById("btnAppleCal");
if (btnA) btnA.addEventListener("click", () => {
  // Apple Calendar: se genera un archivo .ics con JavaScript y se descarga.
  const fin = fechaFinEvento();
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
    "UID:" + Date.now() + "@victoria-fiesta",
    "DTSTAMP:" + formatoFechaICS(new Date()),
    "DTSTART:" + formatoFechaICS(fechaEvento),
    "DTEND:" + formatoFechaICS(fin),
    "SUMMARY:" + evento.titulo,
    "DESCRIPTION:" + evento.descripcion + " " + evento.mapsURL,
    "LOCATION:" + evento.direccion,
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "fiesta-victoria-3-anos.ics";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
});

/* ================= 7. FORMULARIO DE ASISTENCIA (solo adultos) ================= */
const listaInvitados = document.getElementById("listaInvitados");
const btnAgregarInvitado = document.getElementById("btnAgregarInvitado");
const form = document.getElementById("formAsistencia");
const formError = document.getElementById("formError");
const formOk = document.getElementById("formOk");
const btnAceptar = document.getElementById("btnAceptar");

// Crea una fila de invitado (input + botón quitar)
function crearFilaInvitado(nombre = "") {
  const fila = document.createElement("div");
  fila.className = "invitado-fila";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "input input-invitado";
  input.placeholder = "Nombre del adulto";
  input.value = nombre;
  input.maxLength = 60;
  input.setAttribute("aria-label", "Nombre del invitado");
  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "btn-quitar";
  quitar.textContent = "✕";
  quitar.title = "Quitar invitado";
  quitar.setAttribute("aria-label", "Quitar invitado");
  quitar.addEventListener("click", () => {
    // Mantener al menos un campo visible
    if (listaInvitados.querySelectorAll(".invitado-fila").length > 1) fila.remove();
    else input.value = "";
  });
  fila.appendChild(input);
  fila.appendChild(quitar);
  return fila;
}

// UNA sola fila vacía por defecto. Los nombres de listaInicialInvitados
// (José Garza, Irene) se conservan como dato inicial pero no se escriben
// en los inputs. El usuario agrega más filas con el botón "+ Agregar invitado".
if (listaInvitados) {
  listaInvitados.appendChild(crearFilaInvitado(""));
}
if (btnAgregarInvitado) {
  btnAgregarInvitado.addEventListener("click", () => {
    const total = listaInvitados.querySelectorAll(".invitado-fila").length;
    if (total >= MAX_INVITADOS) {
      mostrarError(`Puedes registrar hasta ${MAX_INVITADOS} invitados adultos. 💌`);
      return;
    }
    listaInvitados.appendChild(crearFilaInvitado(""));
    const ultimo = listaInvitados.querySelector(".invitado-fila:last-child input");
    if (ultimo) ultimo.focus();
  });
}

function mostrarError(msg) {
  if (!formError) return;
  formError.textContent = msg;
  formError.hidden = false;
  formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Guardar en Firestore (colección "confirmaciones").
// Estructura: { invitados: [...adultos], asistencia, fechaRegistro }
async function guardarConfirmacion(datos) {
  // db viene de firebase.js (null si no hay config/internet → modo local)
  if (typeof db !== "undefined" && db) {
    const registro = {
      ...datos,
      fechaRegistro: (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };
    const ref = await db.collection("confirmaciones").add(registro);
    return { id: ref.id, modo: "firebase" };
  }
  // Modo local (respaldo): no se pierde la confirmación aunque falle Firebase.
  const locales = JSON.parse(localStorage.getItem("confirmaciones-local") || "[]");
  const registro = { ...datos, fechaRegistro: new Date().toISOString(), id: "local-" + Date.now() };
  locales.push(registro);
  localStorage.setItem("confirmaciones-local", JSON.stringify(locales));
  return { id: registro.id, modo: "local" };
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formError) formError.hidden = true;
    if (formOk) formOk.hidden = true;

    // 1) Validar invitados adultos (evitar registros incompletos)
    const nombres = Array.from(listaInvitados.querySelectorAll(".input-invitado"))
      .map((i) => i.value.trim())
      .filter((n) => n.length > 0);
    if (!nombres.length) {
      mostrarError("Escribe al menos el nombre de un invitado. 💌");
      return;
    }
    if (nombres.length > MAX_INVITADOS) {
      mostrarError(`Puedes registrar hasta ${MAX_INVITADOS} invitados adultos. 💌`);
      return;
    }

    // 2) Guardar
    if (btnAceptar) { btnAceptar.disabled = true; btnAceptar.textContent = "Guardando... ⏳"; }
    try {
      const resultado = await guardarConfirmacion({
        invitados: nombres,
        asistencia: true
      });
      if (formOk) {
        formOk.textContent = resultado.modo === "firebase"
          ? "¡Gracias por confirmar! Te esperamos para celebrar los 3 años de Victoria. 🎉"
          : "¡Gracias por confirmar! (Guardado local: revisa tu conexión a Firebase). 🎉";
        formOk.hidden = false;
        formOk.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      lanzarConfeti(220);
    } catch (err) {
      console.error("Error Firestore:", err && err.code, err && err.message, err);
      const codigo = (err && err.code) || "desconocido";
      let ayuda = "Revisa tu conexión e inténtalo de nuevo.";
      if (codigo === "permission-denied") ayuda = "Firebase rechazó el guardado: revisa las Reglas de Firestore en la consola (ver README).";
      else if (codigo === "unavailable") ayuda = "No hay conexión con el servidor de Firebase.";
      else if (codigo === "failed-precondition" || codigo === "not-found" || codigo === 404) ayuda = "La base de datos de Firestore no existe: créala en la consola de Firebase (ver README).";
      mostrarError(`No pudimos guardar tu confirmación. ${ayuda} 🙏 (código: ${codigo})`);
    } finally {
      if (btnAceptar) { btnAceptar.disabled = false; btnAceptar.textContent = "✅ Aceptar asistencia"; }
    }
  });
}

// Estado de conexión visible bajo el formulario (ayuda a diagnosticar Firestore).
(function mostrarEstadoFirebase() {
  const el = document.getElementById("estadoFirebase");
  if (!el) return;
  if (typeof db !== "undefined" && db) {
    el.textContent = "Conectado a Firebase ✅";
  } else {
    el.textContent = "Sin conexión a Firebase (modo local) ⚠️ Revisa tu internet o la configuración en firebase.js.";
  }
})();

/* ================= 8. MESA DE REGALOS ================= */
const btnSobre = document.getElementById("btnSobre");
const btnRegalo = document.getElementById("btnRegalo");
const mensajeRegalo = document.getElementById("mensajeRegalo");

function mostrarMensajeRegalo() {
  if (!mensajeRegalo) return;
  mensajeRegalo.hidden = false;
  mensajeRegalo.scrollIntoView({ behavior: "smooth", block: "center" });
  // Pequeña celebración sin saturar
  try { lanzarConfeti(80); } catch (e) { /* confeti opcional */ }
}
if (btnSobre) btnSobre.addEventListener("click", mostrarMensajeRegalo);
if (btnRegalo) btnRegalo.addEventListener("click", mostrarMensajeRegalo);

/* ================= 9. REVEAL AL HACER SCROLL ================= */
let revealObserver = null;
function activarReveal() {
  const els = document.querySelectorAll("#step3 .reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => revealObserver.observe(el));
}
