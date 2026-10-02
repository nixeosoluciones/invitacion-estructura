# 🎂 Invitación — Victoria Palacios Nava · 3 años

Invitación digital premium e interactiva (HTML + CSS + JS puro + Firebase + Netlify).
Referencia de experiencia: `sapthesh/Birthday-V2` (sobre → carta → fiesta, globos y máquina de escribir).

## 📁 Estructura lista para Netlify

```
invitacion-victoria/
├── index.html
├── style.css
├── script.js
├── firebase.js
├── firestore.rules
├── netlify.toml
├── README.md
└── assets/
    ├── portada.png        (foto de inicio Bely y Beto)
    ├── central.jpg        (foto central)
    ├── te-invito.png      (carta "te invito a mi fiesta")
    ├── nombre-edad.png    (nombre + edad)
    ├── personajes.png
    ├── logo.png
    ├── fondo.webp         (fondo)
    ├── bely.webp / beto.webp
    ├── nuevo-fondo.jpg    (fondo de soles y estrellas de toda la página)
    ├── foto_ubicacion.png (foto REAL del lugar — no reemplazar)
    └── (sin archivos de música: el audio viene de YouTube)
```

## 🎵 Mix de música desde YouTube (solo audio, sin video visible)

- Pista 1: https://www.youtube.com/watch?v=hSZbeDDWi1Y (inicia en 0:03)
- Pista 2: https://www.youtube.com/watch?v=XawkQr8NOEg (inicia en 0:35)

El audio se transmite directo desde YouTube: **no gasta ancho de banda de Netlify**
y no hay que subir ningún MP3. Al abrir la fiesta suena una pista al azar; con
los botones flotantes **Pista 1 / Pista 2** el invitado elige canción y con
**Pausar/Seguir** detiene o reanuda. Al terminar una canción sigue otra al azar.

- Para cambiar canciones edita `PLAYLIST` en `script.js` (ID + segundo de inicio).
- Nota: si el dueño de un video desactiva la inserción o hay anuncios, YouTube
  puede mostrar un anuncio antes del audio; es el costo de no alojar el MP3.

## 🔥 Firebase (Cloud Firestore)

1. Ve a https://console.firebase.google.com → tu proyecto **fiestabellybeto** → Configuración.
2. Abre `firebase.js` y pega tu `firebaseConfig` donde se indica
   (ya trae tus valores de `firebase.txt`, solo reemplázalos si cambias de proyecto).
3. En Firestore Database → Crear base de datos → **modo producción**.
4. Colección `confirmaciones` (se crea sola al primer registro):
   ```
   confirmaciones / ID_AUTOMATICO
     ├── invitados: ["José Garza", "Irene", ...]
     ├── cantidadNinos: 2
     ├── asistencia: true
     └── fechaRegistro: timestamp
   ```
5. Colección `confirmaciones` (se crea sola al primer registro).
6. Reglas (Firestore Database → Reglas → pegar → **Publicar**). Las
   confirmaciones solo se escriben desde el formulario.
   El archivo **`firestore.rules`** de esta carpeta ya trae el bloque completo
   listo para pegar (o para `firebase deploy --only firestore:rules`):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /confirmaciones/{id} {
         allow read: if false;
         allow create: if request.resource.data.invitados is list
           && request.resource.data.invitados.size() > 0
           && request.resource.data.cantidadNinos is number
           && request.resource.data.asistencia == true;
         allow update, delete: if false;
       }
     }
   }
   ```
7. Si Firebase falla o no hay internet, las confirmaciones se guardan en
   `localStorage` como respaldo y se avisa al usuario.

## ✏️ Qué editar rápido (todo en `script.js`)

| Quiero cambiar… | Dónde |
|---|---|
| Hora del evento | `HORA_EVENTO` + pon `HORA_CONFIRMADA = true` |
| Fecha | `evento.fechaISO` |
| Lugar / Maps | `evento.mapsURL` |
| Dirección del salón | `evento.direccion` |
| Canciones del mix (ID + segundo de inicio) | `PLAYLIST` |
| Invitados iniciales | `listaInicialInvitados` |
| Máx. niños (+) | `MAX_NINOS` |
| Título/descripción calendario | `evento.titulo`, `evento.descripcion` |

## 🚀 Publicar en Netlify

Opción A (arrastrar): https://app.netlify.com → Sites → arrastra la carpeta `invitacion-victoria`.
Opción B (Git): sube la carpeta a GitHub → Netlify → Add new site → Import → sin build command,
publish directory = `invitacion-victoria` (o la raíz si subes solo su contenido).

No hay Node.js ni backend: Netlify sirve archivos estáticos y Firebase es el backend.
