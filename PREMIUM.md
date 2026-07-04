# Plan Premium — Próximas funcionalidades

> Documento de referencia para las features que separan el plan **Básico** (gratuito) del plan **Premium** (pago).

## Resumen

| Funcionalidad | Básico | Premium |
|--------------|:------:|:-------:|
| Catálogo público con slider | ✅ | ✅ |
| Subida de imágenes (Multer + Sharp) | ✅ | ✅ |
| 10 temas visuales | ✅ | ✅ |
| Gestión de categorías | ✅ | ✅ |
| Checkout → WhatsApp estructurado | ✅ | ✅ |
| **Pedidos — Historial y panel** | ❌ | ✅ |
| **Estados de pedido** | ❌ | ✅ |
| **Estadísticas de ventas** | ❌ | ✅ |
| **Notificaciones de nuevos pedidos** | ❌ | ✅ |

---

## 1. Pedidos — Tabla y registro

### Esquema de base de datos

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT DEFAULT '',
  items_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'efectivo',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pendiente',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);
```

### Flujo

1. El cliente completa el checkout (nombre, teléfono, dirección, método de pago)
2. Se guarda el pedido en la tabla `orders` con estado `pendiente`
3. Se abre WhatsApp con el mensaje estructurado (igual que hoy)
4. El pedido queda visible en el panel del dashboard

---

## 2. Panel de pedidos en el dashboard

### Listado de pedidos

```
┌──────┬──────────┬──────────┬──────────────────┬──────────────────┐
│ #    │ Cliente  │ Total    │ Estado           │ Hace             │
├──────┼──────────┼──────────┼──────────────────┼──────────────────┤
│ 1042 │ Carlos   │ $5.700   │ 🔵 Pendiente     │ hace 5 min       │
│ 1041 │ María    │ $3.200   │ 🟢 Entregado     │ hace 1 hora      │
│ 1040 │ Juan     │ $8.900   │ 🔴 Cancelado     │ hace 3 horas     │
│ 1039 │ Ana      │ $4.500   │ 🟡 Preparando    │ hace 2 horas     │
└──────┴──────────┴──────────┴──────────────────┴──────────────────┘
```

### Detalle del pedido (modal)

Al hacer clic en un pedido:

```
┌─────────────────────────────────────┐
│  Pedido #1042                       │
│  hace 5 minutos                     │
│                                     │
│  🧑 Carlos                          │
│  📱 5491122334455                   │
│  📍 Av. Siempre Viva 123            │
│                                     │
│  ─── Productos ───                  │
│  🍔 Cheeseburger x2    $3.200       │
│  🥤 Coca Cola x1       $1.200       │
│  🍟 Papas extra x1      $800        │
│  ──────────────────────             │
│  Subtotal              $5.200       │
│  Delivery              $500         │
│  *Total*               $5.700       │
│                                     │
│  💬 Sin cebolla porfa               │
│  💳 Transferencia                   │
│                                     │
│  Estado: 🔵 Pendiente               │
│  ┌──────┐ ┌──────┐ ┌──────────┐    │
│  │ ✅   │ │ 🍳   │ │ 📦 Listo │    │
│  │ Acept│ │ Prep │ │          │    │
│  └──────┘ └──────┘ └──────────┘    │
└─────────────────────────────────────┘
```

### Estados del pedido

| Estado | Significado | Acción del dueño |
|--------|------------|------------------|
| `pendiente` | Acaba de llegar | Revisar |
| `aceptado` | Lo va a tomar | Clic en ✅ Aceptar |
| `preparando` | Lo están cocinando | Clic en 🍳 Preparando |
| `listo` | Terminado, espera retiro/envío | Clic en 📦 Listo |
| `entregado` | Cliente lo recibió | Clic en ✅ Entregado |
| `cancelado` | No se pudo completar | Clic en ❌ Cancelar |

---

## 3. Estadísticas de ventas

### Dashboard de métricas

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Hoy         │ │  Esta semana │ │  Este mes    │ │  Producto    │
│  $12.500     │ │  $45.200     │ │  $180.000    │ │  top         │
│  4 pedidos   │ │  18 pedidos  │ │  72 pedidos  │ │  Cheeseburger│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Consultas clave

```sql
-- Ventas del día
SELECT COUNT(*), SUM(total) FROM orders 
WHERE store_id = ? AND date(created_at) = date('now');

-- Producto más vendido (del mes)
SELECT p.name, SUM(oi.qty) as total_vendido
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.store_id = ? AND oi.created_at >= date('now', '-30 days')
GROUP BY p.id ORDER BY total_vendido DESC LIMIT 5;

-- Pedidos por estado
SELECT status, COUNT(*) FROM orders
WHERE store_id = ? GROUP BY status;
```

---

## 4. Notificaciones de nuevos pedidos

- **Sonido** en el dashboard cuando llega un pedido nuevo
- **Badge** con el número de pedidos pendientes en el título de la pestaña
- Opcional: notificación push o alerta visual si el dashboard está abierto

---

## 5. Estrategia de monetización

### Activación

Cuando el usuario intente acceder al panel de pedidos:

```
🔒 Función exclusiva Premium
──────────────────────────────
El historial de pedidos y las
estadísticas de ventas están
disponibles solo en el plan Premium.

[  Ver planes  ]  [  Volver  ]
```

### Upgrade

- El plan se activa por `store` (no por `user`)
- Columna `tier` en `users` — cambiar de `'standard'` a `'premium'`
- Ideal: usar un proveedor de pagos (Mercado Pago, Stripe) para cobrar la suscripción

---

## Prioridad de implementación

| Prioridad | Feature | Esfuerzo estimado |
|:---------:|---------|:-----------------:|
| 🔴 Alta | Pedidos — tabla + registro desde checkout | ~400 líneas |
| 🔴 Alta | Panel de pedidos en dashboard | ~300 líneas |
| 🟡 Media | Estados del pedido con botones | ~150 líneas |
| 🟡 Media | Estadísticas básicas | ~200 líneas |
| 🟢 Baja | Notificaciones de nuevos pedidos | ~100 líneas |
| 🟢 Baja | Sistema de pagos / suscripción | ~500 líneas (depende del proveedor) |

---

> 📅 Documento creado el 4 de julio de 2026. Pendiente de implementar cuando la base de usuarios lo justifique.
