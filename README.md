# 🎂 Birthday App

App interactiva de cumpleaños con countdown, mini-juego de globos, mural de campeones y confirmación de asistencia.

---

## 🗂️ Estructura

```
birthday-app/
├── src/
│   ├── lib/
│   │   ├── firebase.js     ← inicialización Firebase
│   │   ├── db.js           ← todas las operaciones Firestore
│   │   └── audio.js        ← motor de sonidos Web Audio API
│   ├── components/
│   │   ├── BgLayer.jsx     ← fondos animados por tema
│   │   ├── Confetti.jsx    ← lluvia de confetti
│   │   ├── NavBar.jsx      ← barra de navegación inferior
│   │   └── TimerBox.jsx    ← caja de número del countdown
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── BalloonGame.jsx
│   │   ├── GameOver.jsx
│   │   ├── LeaderboardScreen.jsx
│   │   ├── RSVPScreen.jsx
│   │   └── AdminScreen.jsx
│   ├── themes.js           ← paletas arcade / kawaii / fiesta
│   ├── App.jsx             ← root + routing
│   └── main.jsx
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── vercel.json
└── .env.example
```

---

## 🔥 Paso 1 — Crear proyecto Firebase (gratis)

1. Ir a **https://console.firebase.google.com**
2. **"Agregar proyecto"** → ponerle un nombre → desactivar Analytics → Crear
3. En el panel: **"Web"** (ícono `</>`) → registrar app → copiar `firebaseConfig`
4. Ir a **Firestore Database** → Crear base de datos → **Modo de prueba** → Siguiente → Finalizar
5. Ir a **Reglas** de Firestore y pegar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Estas reglas son abiertas (perfectas para una fiesta). Para producción seria, agregarías autenticación.

---

## ⚙️ Paso 2 — Configurar variables de entorno

```bash
# Copiar el template
cp .env.example .env

# Editar .env con tus datos de Firebase
# (los copiás desde Firebase Console → Project Settings → Web app)
```

El `.env` queda así:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🐳 Paso 3 — Correr en local con Docker

```bash
# Construir y levantar (primera vez tarda ~2 min)
docker compose up --build

# Visitar
http://localhost:5173
```

Para detener:
```bash
docker compose down
```

Para ver logs:
```bash
docker compose logs -f
```

---

## 🚀 Paso 4 — Deploy en Vercel

### 4.1 Subir a GitHub
```bash
git init
git add .
git commit -m "🎂 Initial commit"

# Crear repo en github.com, luego:
git remote add origin https://github.com/TU_USUARIO/birthday-app.git
git push -u origin main
```

### 4.2 Conectar con Vercel
1. Ir a **https://vercel.com** → Log in with GitHub
2. **"Add New Project"** → importar tu repo `birthday-app`
3. Framework: **Vite** (se detecta automático)
4. **Environment Variables** → agregar las 6 variables de tu `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. **Deploy** → en ~1 minuto tenés tu URL pública 🎉

### 4.3 Actualizaciones futuras
```bash
git add .
git commit -m "mejora"
git push   # ← Vercel redeploya automáticamente
```

---

## 🔧 Admin

- Botón ⚙️ en la nav bar → PIN: **1234**
- Configurar: nombre, edad, fecha del cumple
- Cambiar estilo visual (arcade / kawaii / fiesta)
- Resetear puntajes o RSVPs

---

## 📱 Compartir con invitados

Una vez deployado, mandás la URL de Vercel por WhatsApp. Todos comparten la misma base de datos Firebase, entonces:
- Confirman asistencia desde sus casas
- Juegan y su puntaje aparece en el mural compartido
- Ven el countdown en tiempo real
