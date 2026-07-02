# Plan de Implementación Final: SaaS Multi-Usuario (Revisión Arquitectónica)

Este plano arquitectónico detalla la estructura y especificaciones técnicas para transformar el catálogo estático en un SaaS robusto y seguro. Ha sido diseñado con aislamiento de seguridad de archivos y persistencia de grado de producción para ser ejecutado por el implementador ("maestro mayor de obra").

---

## 0. Acceso a la Memoria Persistente (Engram) para el Implementador

Para que el implementador ("maestro mayor de obra") acceda a todo el contexto histórico, decisiones de diseño y resúmenes de este proyecto en Engram, debe seguir las siguientes directrices al iniciar la sesión:

1.  **Recuperación Automática de Contexto**: Al iniciar la sesión, el agente debe ejecutar la herramienta `mem_context` para recuperar los resúmenes de las sesiones anteriores del proyecto `antigravity`.
2.  **Búsqueda Proactiva**: El agente puede buscar directamente en la memoria persistente utilizando la herramienta `mem_search` con las palabras clave: `"pedidosya-saas"`, `"architecture"`, o `"SaaS Multi-Usuario"`.
3.  **Clave de Tema Arquitectónico (Topic Key)**: Las decisiones de diseño de este SaaS se encuentran registradas bajo la clave estable:
    *   `topic_key: "architecture/pedidosya-saas"`
    El implementador puede consultar el contenido completo e inalterado de esta observación usando la herramienta `mem_get_observation` asociada a dicho registro.

---

## 1. Estructura de Directorios Propuesta (Seguridad y Aislamiento)

Para evitar que los clientes puedan acceder a archivos sensibles del servidor (como `server.js` o el archivo de base de datos `saas.db`), aislaremos todos los recursos públicos en una carpeta `/public`.

```text
/pedidosYa  (Raíz del Proyecto)
│
├── server.js               # Código del backend (Express) - SEGURO
├── saas.db                 # Base de datos SQLite - SEGURO
├── package.json            # Dependencias del proyecto - SEGURO
├── .env                    # Configuración secreta (puerto, secret_keys) - SEGURO
│
└── /public                 # Carpeta de acceso público
    ├── index.html          # Catálogo dinámico del cliente
    ├── login.html          # Panel de inicio de sesión
    ├── signup.html         # Panel de registro
    ├── dashboard.html      # Panel de administración (SaaS)
    │
    ├── /css
    │   ├── styles.css      # Estilos del catálogo
    │   └── dashboard.css   # Estilos del panel de administración
    │
    ├── /js
    │   ├── app.js          # Lógica dinámica del catálogo
    │   └── dashboard.js    # Lógica del panel de administración
    │
    └── /uploads            # Carpeta para imágenes optimizadas subidas por los usuarios
```

---

## 2. Pila Tecnológica y Dependencias Precisas

El implementador deberá instalar los siguientes paquetes en `package.json`:
*   `express`: Servidor web principal.
*   `express-session`: Manejo de sesiones tradicionales basadas en cookies.
*   `connect-sqlite3`: Adaptador para guardar las sesiones de usuario directamente en la base de datos SQLite (evita que los usuarios se deslogueen al reiniciar el servidor).
*   `sqlite3` o `better-sqlite3`: Driver para interactuar con la base de datos SQLite.
*   `bcryptjs`: Encriptación de contraseñas de comerciantes.
*   `multer`: Procesamiento de carga de archivos (imágenes).
*   `sharp`: Procesador y compresor de imágenes de alto rendimiento (conversión a WebP).
*   `dotenv`: Gestión de variables de entorno.

---

## 3. Especificación de Base de Datos SQLite (Esquema Definitivo)

```sql
-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    tier TEXT DEFAULT 'standard', -- 'standard' o 'premium'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: stores (Configuración de la tienda)
CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- Ej: 'burger-palace' (URL única)
    name TEXT NOT NULL,
    logo_url TEXT DEFAULT '/uploads/default-logo.webp',
    cover_url TEXT DEFAULT '/uploads/default-cover.webp',
    address TEXT,
    whatsapp_number TEXT,
    instagram_handle TEXT,
    delivery_fee INTEGER DEFAULT 0,
    hours_json TEXT, -- Almacena horarios estructurados en formato JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla: categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price REAL NOT NULL,
    original_price REAL, -- Para ofertas tachadas
    has_discount INTEGER DEFAULT 0,
    variants_json TEXT, -- Variantes estructuradas en JSON string: [{name: 'Doble', price: 1900}]
    is_disabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Tabla: orders (Exclusivo Premium)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT,
    payment_method TEXT,
    order_type TEXT, -- 'delivery' o 'takeaway'
    items_json TEXT, -- Detalle completo del pedido en JSON string
    total REAL NOT NULL,
    status TEXT DEFAULT 'pendiente', -- 'pendiente', 'aceptado', 'en_camino', 'entregado', 'cancelado'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);
```

---

## 4. Detalle de Flujo e Integración

### Enrutamiento del Servidor
Express interceptará las peticiones dinámicamente:
*   `GET /s/:slug` -> Servirá el archivo `/public/index.html`.
*   El cliente (`/public/js/app.js`) extraerá el `:slug` de la URL (`window.location.pathname.split('/')[2]`) y hará una llamada a `GET /api/public/store/:slug`.
*   El servidor buscará los datos en SQLite y devolverá la tienda, sus categorías y productos en un JSON.

### Optimización de Fotos con Multer + Sharp
Cuando el comerciante sube un archivo desde el dashboard:
1.  `multer` captura el archivo en memoria (`multer.memoryStorage()`).
2.  `sharp` toma el buffer de memoria:
    ```javascript
    await sharp(req.file.buffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(path.join(__dirname, 'public', 'uploads', `${filename}.webp`));
    ```
3.  El servidor guarda la ruta `/uploads/nombre.webp` en la base de datos.
4.  Se retorna la ruta de la imagen procesada al cliente.

### Flujo de Checkout Diferenciado (Standard vs Premium)
*   **Standard**: El botón "Enviar Pedido" lee la información, construye el texto para WhatsApp, y abre la URL `https://api.whatsapp.com/send?phone=...&text=...` directamente en el navegador del cliente.
*   **Premium**: El botón "Enviar Pedido" hace un `POST /api/public/orders` al servidor con los datos de la compra. Tras recibir una respuesta exitosa (`201 Created`), abre el enlace de WhatsApp para que el cliente también envíe el mensaje al comerciante.

---

## 5. Plan de Verificación

El implementador deberá validar las siguientes compuertas de seguridad y lógica:
1.  **Aislamiento de Servidor**: Intentar abrir `http://localhost:3000/server.js` y `http://localhost:3000/saas.db` en el navegador. Deberá retornar un error `404 Not Found`.
2.  **Validación de Sesiones**: Verificar que el comerciante no pueda acceder a `/dashboard.html` si no ha iniciado sesión, redireccionándolo a `/login.html`.
3.  **Tamaño de Archivo**: Comprobar que una imagen de 6MB subida se guarde en `public/uploads` con extensión `.webp` ocupando menos de 100KB de espacio.
4.  **Diferencia de Planes**: Validar que una cuenta Standard no registre datos en la tabla `orders` al hacer checkouts, y que su panel "Pedidos" en el dashboard esté bloqueado y sugiera la suscripción Premium.
