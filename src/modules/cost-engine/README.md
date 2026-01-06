# Módulo Cost Engine - Motor de Costos

## Descripción

El módulo **Cost Engine** es un sistema completo para calcular costos y precios de carta para productos de cafetería. Permite gestionar materias primas, crear recetas, definir gastos fijos y calcular automáticamente los precios de venta con márgenes de ganancia.

## Arquitectura

### Backend

#### Base de Datos
El módulo utiliza las siguientes tablas:

- **suppliers**: Proveedores de materias primas
- **raw_materials**: Materias primas con precios y unidades
- **recipes**: Recetas compuestas por ingredientes
- **recipe_ingredients**: Relación many-to-many entre recetas e ingredientes
- **cost_products**: Productos finales de carta con cálculos de precio
- **fixed_costs**: Gastos fijos (globales o por producto)
- **price_history**: Historial de cambios de precios (opcional)

#### Servicios
- **CostCalculationService**: Contiene toda la lógica de cálculo:
  - `calculateUnitCost()`: Calcula costo unitario de materias primas
  - `calculateRecipeCost()`: Calcula costo total de una receta
  - `calculateFinalPrice()`: Calcula precio final con márgenes
  - `calculateFixedCost()`: Calcula gastos fijos según tipo

#### Modelos
- **RawMaterialsModel**: Gestión de materias primas
- **SuppliersModel**: Gestión de proveedores
- **RecipesModel**: Gestión de recetas e ingredientes
- **CostProductsModel**: Gestión de productos finales
- **FixedCostsModel**: Gestión de gastos fijos

#### Controladores y Routers
Todos los endpoints están bajo `/api/cost-engine/`:
- `/suppliers` - CRUD de proveedores
- `/raw-materials` - CRUD de materias primas
- `/recipes` - CRUD de recetas
- `/products` - CRUD de productos de costo
- `/fixed-costs` - CRUD de gastos fijos

### Frontend

El módulo está organizado en pestañas (tabs) dentro de una página principal:

1. **Proveedores**: Gestión de proveedores
2. **Materias Primas**: Gestión de materias primas con cálculo automático de costo unitario
3. **Recetas**: Creación de recetas con múltiples ingredientes
4. **Productos**: Productos finales con cálculo automático de precios
5. **Gastos Fijos**: Definición de gastos fijos globales o por producto

## Funcionalidades

### 1. Materias Primas

- **Agregar materia prima**: Nombre, proveedor, precio de compra, cantidad, unidad
- **Cálculo automático**: El costo unitario se calcula automáticamente
- **Unidades soportadas**: kg, gr, l, ml, unidad
- **Conversión automática**: El sistema convierte entre unidades del mismo tipo

**Ejemplo**:
- Queso muzzarella
- Proveedor: Don Ángel
- Precio: $7,600
- Cantidad: 1000 gr
- **Costo unitario calculado**: $7.60/gr

### 2. Recetas

- **Crear recetas**: Nombre, descripción, lista de ingredientes
- **Ingredientes**: Materia prima, cantidad, unidad
- **Cálculo automático**: El costo de la receta se calcula sumando los costos de ingredientes
- **Recálculo automático**: Si cambia el precio de una materia prima, se recalculan todas las recetas que la usan

**Ejemplo**:
- Café con leche:
  - Café molido: 18 gr
  - Agua: 40 ml
  - Leche: 130 ml
- **Costo de receta**: Suma de (cantidad × costo unitario) de cada ingrediente

### 3. Gastos Fijos

- **Tipos de gastos fijos**:
  - **Por ítem**: Costo fijo por cada producto
  - **Por minuto**: Costo fijo multiplicado por tiempo de preparación
  - **Global**: Costo fijo aplicado a todos los productos
- **Asignación**: Pueden ser globales o específicos por producto

### 4. Cálculo de Precio Final

Para cada producto se calcula:

1. **Costo de receta**: Suma de costos de ingredientes
2. **Gastos fijos**: Según tipo (por ítem, por minuto, global)
3. **Costo total**: Costo de receta + gastos fijos
4. **Precio sugerido**: Costo total × (1 + margen%)
5. **Precio redondeado**: Precio sugerido redondeado a múltiplos de 10

**Fórmula**:
```
Costo Total = Costo Receta + Gastos Fijos
Precio Sugerido = Costo Total × (1 + Margen% / 100)
Precio Carta = Redondear(Precio Sugerido, múltiplo de 10)
```

### 5. Recalculación Automática

El sistema recalcula automáticamente cuando:
- Se actualiza el precio de una materia prima → Recalcula recetas → Recalcula productos
- Se modifica una receta → Recalcula productos que la usan
- Se cambia un gasto fijo o margen → Recalcula el producto

## Uso

### Acceder al módulo

1. Navegar a `/cost-engine` en la aplicación
2. El módulo se abre con 5 pestañas principales

### Flujo de trabajo recomendado

1. **Proveedores**: Agregar proveedores primero
2. **Materias Primas**: Agregar materias primas con sus precios
3. **Recetas**: Crear recetas usando las materias primas
4. **Gastos Fijos**: Definir gastos fijos (opcional)
5. **Productos**: Crear productos finales asignando recetas y márgenes

### Ejemplo completo

1. **Proveedor**: "Don Ángel"
2. **Materia Prima**: 
   - Queso muzzarella
   - Precio: $7,600
   - Cantidad: 1000 gr
   - Costo unitario: $7.60/gr
3. **Receta**: "Pizza Muzzarella"
   - Queso: 200 gr → $1,520
   - Masa: 300 gr → $500
   - Salsa: 50 ml → $100
   - **Costo total receta**: $2,120
4. **Producto**: "Pizza Muzzarella"
   - Receta: Pizza Muzzarella
   - Gasto fijo: $500 (por ítem)
   - Margen: 50%
   - **Costo total**: $2,620
   - **Precio sugerido**: $3,930
   - **Precio carta**: $4,000

## API Endpoints

### Proveedores
- `GET /api/cost-engine/suppliers` - Listar todos
- `GET /api/cost-engine/suppliers/:id` - Obtener uno
- `POST /api/cost-engine/suppliers` - Crear
- `PUT /api/cost-engine/suppliers/:id` - Actualizar
- `DELETE /api/cost-engine/suppliers/:id` - Eliminar

### Materias Primas
- `GET /api/cost-engine/raw-materials` - Listar todas
- `GET /api/cost-engine/raw-materials/:id` - Obtener una
- `POST /api/cost-engine/raw-materials` - Crear
- `PUT /api/cost-engine/raw-materials/:id` - Actualizar (recalcula automáticamente)
- `DELETE /api/cost-engine/raw-materials/:id` - Eliminar

### Recetas
- `GET /api/cost-engine/recipes` - Listar todas
- `GET /api/cost-engine/recipes/:id` - Obtener una
- `POST /api/cost-engine/recipes` - Crear
- `PUT /api/cost-engine/recipes/:id` - Actualizar
- `POST /api/cost-engine/recipes/:id/recalculate` - Recalcular manualmente
- `DELETE /api/cost-engine/recipes/:id` - Eliminar

### Productos
- `GET /api/cost-engine/products` - Listar todos
- `GET /api/cost-engine/products/:id` - Obtener uno
- `POST /api/cost-engine/products` - Crear
- `PUT /api/cost-engine/products/:id` - Actualizar
- `POST /api/cost-engine/products/:id/recalculate` - Recalcular precio
- `DELETE /api/cost-engine/products/:id` - Eliminar

### Gastos Fijos
- `GET /api/cost-engine/fixed-costs` - Listar todos
- `GET /api/cost-engine/fixed-costs/global` - Solo globales
- `GET /api/cost-engine/fixed-costs/product/:productId` - Por producto
- `GET /api/cost-engine/fixed-costs/:id` - Obtener uno
- `POST /api/cost-engine/fixed-costs` - Crear
- `PUT /api/cost-engine/fixed-costs/:id` - Actualizar
- `DELETE /api/cost-engine/fixed-costs/:id` - Eliminar

## Buenas Prácticas

1. **Mantener precios actualizados**: Actualiza los precios de materias primas regularmente
2. **Revisar recetas**: Verifica que las cantidades de ingredientes sean correctas
3. **Ajustar márgenes**: Ajusta los márgenes según tu estrategia de precios
4. **Gastos fijos realistas**: Define gastos fijos basados en costos operativos reales
5. **Historial de precios**: El sistema guarda historial para análisis futuro

## Escalabilidad

El módulo está diseñado para escalar:

- **Combos**: Se pueden crear productos que usen múltiples recetas
- **Promociones**: Los precios pueden ajustarse manualmente
- **Múltiples ubicaciones**: La estructura permite agregar ubicaciones en el futuro
- **Análisis**: El historial de precios permite análisis de tendencias

## Notas Técnicas

- **Conversión de unidades**: El sistema convierte automáticamente entre unidades del mismo tipo (peso: kg↔gr, volumen: l↔ml)
- **Precisión**: Los cálculos se redondean a 2 decimales
- **Precios redondeados**: Los precios de carta se redondean a múltiplos de 10
- **Soft delete**: Los registros se desactivan (active=0) en lugar de eliminarse físicamente
