-- Falco Catalog Sync
-- Generated: 2026-03-18 11:34:10
-- WARNING: This will REPLACE all catalog data. Back up your DB first!

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

DELETE FROM coffees;
DELETE FROM services;
DELETE FROM stock_menu_item_map;
DELETE FROM stock_products;
DELETE FROM fixed_costs;
DELETE FROM cost_products;
DELETE FROM recipe_ingredients;
DELETE FROM recipes;
DELETE FROM raw_materials;
DELETE FROM suppliers;
DELETE FROM payment_methods;
DELETE FROM menu_items;
DELETE FROM menu_category;

-- menu_category (5 rows)
INSERT INTO menu_category (category_id, name) VALUES (1, 'Café');
INSERT INTO menu_category (category_id, name) VALUES (2, 'Otras Opciones');
INSERT INTO menu_category (category_id, name) VALUES (3, 'Para Acompañar');
INSERT INTO menu_category (category_id, name) VALUES (4, 'Extras');
INSERT INTO menu_category (category_id, name) VALUES (5, 'Envasados');

-- menu_items (84 rows)
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (3, 'ESP', 'Espresso', 'Espresso doble', 3500, 1, '2025-09-11 21:54:01', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (4, 'LAT', 'Latte', 'Cafe con leche', 4200, 1, '2025-09-11 22:36:45', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (5, 'AME', 'Americano', 'Espresso con agua', 4000, 1, '2025-09-12 01:29:41', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (6, 'V60', 'Filtrado', 'V60', 6000, 1, '2025-09-12 01:30:13', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (7, 'TEB', 'Blends de Té en hebras', 'Té en hebras', 3500, 1, '2025-09-12 01:33:56', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (8, 'CHO', 'Chocolatada', 'Leche y Cacao', 3500, 1, '2025-09-12 01:33:56', '2026-02-08 13:14:23', 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (9, 'SUB', 'Submarino', 'Leche y Barra de chocolate', 3500, 1, '2025-09-12 01:33:56', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (10, 'ICE', 'Iced Coffee', 'Espresso con agua y hielo', 4500, 1, '2025-09-12 01:33:56', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (11, 'CAP', 'Cappucino', 'Doble soht + Leche + Choco + Canela', 5000, 1, '2025-11-06 11:29:21', '2026-01-21 11:19:49', 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (12, 'BOM', 'Café Bombón', 'Doble shot + leche condensada + espuma de leche', 5000, 1, '2025-11-06 11:38:09', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (13, 'AFO', 'Affogato', 'Doble shot + Bocha de helado americana + salsa de choco', 6500, 1, '2025-11-06 11:38:09', '2026-01-21 11:20:06', 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (14, 'IRL', 'Irlandes', 'Whisky + café + espuma de leche', 6500, 1, '2025-11-06 11:38:09', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (15, 'CBR', 'Cold Brew', 'Café infusionado en frio por 12 horas', 5000, 1, '2025-11-06 11:38:09', '2026-01-21 11:18:54', 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (16, 'ICB', 'Iced Coffee Black', 'Doble shot + agua + hielos infusionados en café', 4500, 1, '2025-11-06 11:38:09', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (17, 'ICW', 'Iced Coffee White', 'Doble soht + leche + hielos infusionados en café', 5000, 1, '2025-11-06 11:38:09', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (18, 'THE', 'Té Helado', 'Blend de té helado', 3500, 1, '2025-09-12 01:33:56', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (19, 'LIT', 'Limonada Tradicional', 'Limon + Jengibre + Almibar', 3500, 1, '2025-09-12 01:33:56', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (20, 'LIF', 'Limonada Frutos Rojos', 'Limon + Frutos rojos + Almibar', 3500, 1, '2025-09-12 01:33:56', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (21, 'AGU', 'Agua sin gas', '', 1500, 1, '2025-09-12 01:33:56', NULL, 5);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (22, 'SOD', 'Agua con gas', '', 1800, 1, '2025-09-12 01:33:56', NULL, 5);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (23, 'MDU', 'Medialuna dulce', '', 1500, 1, '2025-09-12 01:33:56', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (24, 'MSA', 'Medialuna salada', '', 1500, 1, '2025-09-12 01:33:56', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (25, 'CRO', 'Croissant', '', 3200, 1, '2025-09-12 01:33:56', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (26, 'CHO', 'Pan de chocolate', '', 3200, 1, '2025-09-12 01:33:56', '2026-03-13 21:18:52', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (27, 'COO', 'Cookie', '', 2800, 1, '2025-09-12 01:33:56', '2026-03-01 23:22:28', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (28, 'LAL', 'Leche de Almendras', 'Exra leche de almendras', 800, 1, '2025-09-12 01:33:56', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (29, 'LDE', 'Leche deslactosada', 'Extra leche deslactosada', 800, 1, '2025-09-12 01:33:56', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (30, 'CHI', 'Chipa XL', 'Chipa extra grande', 2500, 1, '2025-11-12 11:43:08', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (31, 'DOB', 'Doble', 'Shot doble', 500, 1, '2025-11-12 11:45:20', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (32, 'YOG', 'Yogurt con granola', 'Yogurt + Granola + Frutas', 7200, 1, '2025-11-13 20:14:17', '2026-02-18 12:08:43', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (33, 'LAG', 'Lagrima', 'Leche + shot espresso', 4200, 1, '2025-11-14 14:48:55', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (34, 'PRO', 'PROMO', 'Cafe mediauluna', 4000, 1, '2025-11-15 11:47:54', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (35, 'BRO', 'jijodebu', 'Brownie', 3000, 1, '2025-11-16 21:53:02', '2026-02-11 14:48:09', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (36, 'CUA', 'Cafe en grano', 'Cafe en cuarto', 26000, 1, '2025-11-19 12:34:39', '2026-02-27 23:19:53', 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (37, 'PRO', 'Promo Limo', 'Promo limonada', 4500, 1, '2025-11-19 21:52:44', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (38, 'ALF', 'Alfajor sin TACC', 'Alfajor sin Tacc', 2500, 1, '2025-11-19 21:56:35', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (39, 'BUD', 'Budin Redondo', 'Budin redondo', 2500, 1, '2025-11-21 11:40:35', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (40, 'BUD', 'Budin Relleno Choco', 'Budin relleno chocolate', 3000, 1, '2025-11-21 11:41:26', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (41, 'JUG', 'Jugo Naranja', 'Jugo exprimido de naranja', 3500, 1, '2025-11-21 21:22:57', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (42, 'CROJYQ', 'Croissant JYQ', 'Croissant con Jamon y Queso', 6500, 1, '2025-11-21 22:04:12', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (43, 'TBO', 'Tarta Bombon', 'Tarta Bombon', 3600, 1, '2025-11-21 22:04:13', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (44, 'ALM', 'Alfa Maicena', 'Alfajor Maicena', 2500, 1, '2025-11-21 22:04:56', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (45, 'ALF', 'Alfajor chocolate', 'Alfajor chocolate', 3000, 1, '2025-11-22 22:23:56', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (46, 'TAR', 'Tarta Coco', 'Tarda de coco', 3600, 1, '2025-11-23 22:26:03', '2026-02-25 21:02:51', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (47, 'BUD', 'Budin Amapolas', 'Budin limon amapolas', 1800, 1, '2025-11-30 13:31:31', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (48, 'PAS', 'Pastafrola', 'Pasta', 3600, 1, '2025-12-02 21:20:49', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (49, 'LIM', 'Cuadrado Limon', 'Cuadrado de Limon', 2200, 1, '2025-12-06 23:28:51', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (50, 'ALF', 'Alfajor Relleno', 'Alfajor Relleno', 4000, 1, '2025-12-09 17:04:04', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (51, 'ALF', 'Alfa Cookie', 'Alfacookie', 3200, 1, '2025-12-10 20:52:50', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (52, 'TAR', 'Tarta sin TACC', 'Tarta sin Tacc', 5000, 1, '2025-12-10 20:53:18', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (53, 'BUD', 'Budin Porcion', 'Budin Porcion', 2500, 1, '2025-12-18 23:33:26', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (54, 'AER', 'Aeropress', 'Aeropress', 4000, 1, '2025-12-20 20:32:53', '2026-01-21 11:19:26', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (55, 'MIL', 'Milkshake', 'Milkshake', 6000, 1, '2025-12-21 22:11:43', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (56, 'PRO', 'Promo Tostado', 'Promo tostado + cafe', 6000, 1, '2025-12-28 14:45:42', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (57, 'MED', 'Medialuna rellena', 'Medialuna con jamon y queso', 4000, 1, '2026-01-03 13:12:57', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (58, 'CUP', 'Cupcake', 'Cupcake', 3000, 1, '2026-01-06 14:48:00', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (59, 'BRO', 'Brownie', 'Brownie', 3600, 1, '2026-01-06 14:48:47', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (60, 'TOR', 'Torta Frita', 'Torta Frita', 1000, 1, '2026-01-10 21:05:18', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (61, 'EXT', 'Frappuccino', 'Frapu', 7000, 1, '2026-01-14 22:31:07', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (62, 'FRI', 'Op. Frio', 'Opcional Frio', 500, 1, '2026-01-16 00:11:28', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (63, 'OPC', 'Taza Grande', 'Taza Grande', 500, 1, '2026-01-16 00:12:14', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (64, 'EXT', 'Syrup Vainilla', 'Saborizant Caramel-Vainilla', 800, 1, '2026-01-16 00:14:03', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (65, 'EXT', 'Syrup Caramel', 'Saborizante caramelo', 800, 1, '2026-01-16 00:14:45', NULL, 4);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (66, 'SAN', 'Ciabatta JYQ', 'Ciabatta JYQ', 7000, 1, '2026-01-20 12:28:48', '2026-01-24 22:45:45', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (67, 'AME', 'American Orange', 'Espresso doble y Jugo de naranja', 6500, 1, '2026-01-20 13:42:25', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (68, 'MOR', 'Ciabatta mortadela', 'asd', 8000, 1, '2026-01-21 13:40:06', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (69, 'LEM', 'American Lemon ', NULL, 6500, 1, '2026-01-21 21:55:32', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (70, 'SAL', 'Ciabatta salame', '', 8500, 1, '2026-01-21 23:36:57', '2026-03-14 23:03:42', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (71, 'FAL', 'Falco Amargo', NULL, 4500, 1, '2026-01-22 23:01:26', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (72, 'VER', 'Vermouth', NULL, 11000, 1, '2026-01-24 23:30:22', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (73, 'TON', 'Espresso Tonic', NULL, 6500, 1, '2026-01-25 00:32:53', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (74, 'MAT', 'Matecocido', NULL, 2500, 1, '2026-01-29 12:03:53', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (75, 'Ore', 'Cupcake oreo', '', 2500, 1, '2026-02-14 20:25:24', '2026-03-06 13:04:37', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (76, 'LIC', 'Licuado naranja', NULL, 5000, 1, '2026-02-15 23:59:02', NULL, 2);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (77, 'ROL', 'Roll de canela', '', 3200, 1, '2026-02-20 23:39:38', '2026-02-24 12:59:54', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (78, 'LEC', 'Vaso leche', 'Vaso de leche (vaso submarino)', 3000, 1, '2026-03-09 21:53:38', NULL, 1);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (79, 'PIZZ', 'Pizzeta Muzzarella', NULL, 8000, 1, '2026-03-14 23:02:28', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (80, 'JAM', 'Pizzeta Clasica Jamon', NULL, 9000, 1, '2026-03-14 23:02:50', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (81, 'CAL', 'Pizzeta Calabresa', NULL, 9000, 1, '2026-03-14 23:03:08', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (82, 'CAP', 'Pan Caprese', '', 7000, 1, '2026-03-14 23:04:10', '2026-03-14 23:46:52', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (83, 'JAM', 'Pan Jamon', '', 7500, 1, '2026-03-14 23:04:30', '2026-03-14 23:47:07', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (84, 'SAL', 'Pan Salame', '', 7500, 1, '2026-03-14 23:04:49', '2026-03-14 23:47:16', 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (85, 'FOC', 'Focaccia', NULL, 7500, 1, '2026-03-14 23:05:06', NULL, 3);
INSERT INTO menu_items (id, slug, name, description, price, is_active, created_at, updated_at, category_id) VALUES (86, 'Pep', 'Pepas sin tacc', NULL, 5500, 1, '2026-03-17 13:45:41', NULL, 3);

-- payment_methods (4 rows)
INSERT INTO payment_methods (id, name, active, created_at, code) VALUES (576, 'Efectivo', 1, '2025-11-05 14:22:32', 'cash');
INSERT INTO payment_methods (id, name, active, created_at, code) VALUES (577, 'Transferencia', 1, '2025-11-05 14:22:32', 'transfer');
INSERT INTO payment_methods (id, name, active, created_at, code) VALUES (578, 'Código QR', 1, '2025-11-05 14:22:32', 'qr_code');
INSERT INTO payment_methods (id, name, active, created_at, code) VALUES (579, 'Débito / Credito', 1, '2025-11-05 14:22:32', 'card');

-- suppliers (14 rows)
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (1, 'Greña', NULL, NULL, '2026-01-06T13:31:08.596Z', 0, '123123');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (2, 'Aconcagua', NULL, NULL, '2026-01-06T13:32:11.373Z', 1, NULL);
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (3, 'Bartolito', NULL, NULL, '2026-01-06T13:32:27.062Z', 1, '3424781507');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (4, 'Puerto Blest', NULL, NULL, '2026-01-06T13:32:48.092Z', 1, '1170950305');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (5, 'Greña', NULL, NULL, '2026-01-06T13:46:00.956Z', 1, '3425218249');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (6, 'Veneto', NULL, NULL, '2026-01-06T13:47:31.979Z', 1, '3425266658');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (7, 'Tregar', NULL, NULL, '2026-01-06T13:47:56.920Z', 1, '3426201004');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (8, 'Miguel Sin TACC Balais', NULL, NULL, '2026-01-06T13:48:37.562Z', 1, '3424682615');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (9, 'Setta GIN', NULL, NULL, '2026-01-06T13:49:01.137Z', 1, '3425491556');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (10, 'Alvear', NULL, NULL, '2026-01-06T13:49:07.078Z', 1, NULL);
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (11, 'Don Angel', NULL, NULL, '2026-01-06T13:49:11.500Z', 1, NULL);
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (12, 'La Victoria', NULL, NULL, '2026-01-06T13:49:29.103Z', 1, '3424489079');
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (13, 'Buen Sol', NULL, NULL, '2026-01-06T19:57:56.803Z', 1, NULL);
INSERT INTO suppliers (id, name, contact_name, phone, created_at, active, contact_info) VALUES (14, 'Joaquin Hobby', NULL, NULL, '2026-03-05T20:14:33.074Z', 1, NULL);

-- raw_materials (13 rows)
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (1, 'Bidon Agua 20L', 2, 4200, 20, 'l', 0.21, 1, '2026-01-06 13:44:48', '2026-01-06 13:33:27', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (2, 'Cafe 1KG', 4, 50600, 1, 'kg', 50.6, 1, '2026-03-05 20:18:42', '2026-01-06 13:36:05', 4, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (3, 'Leche 1L', 3, 1400, 1, 'l', 1.4, 1, '2026-03-05 20:10:03', '2026-01-06 13:36:42', 9, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (4, 'Medialuna congelada Dulce', 14, 16250, 25, 'unidad', 650, 1, '2026-03-05 20:15:19', '2026-01-06 19:45:32', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (5, 'Medialuna congelada Salada', 14, 16250, 25, 'unidad', 650, 1, '2026-03-05 20:15:31', '2026-01-06 19:46:20', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (6, 'Cafe en 1/4 Nanolote', 4, 17000, 250, 'gr', 68, 1, '2026-03-05 20:20:33', '2026-01-06 19:50:17', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (7, 'Barra Submarino Mapsa', 13, 33940, 50, 'unidad', 678.8, 1, '2026-01-06 19:58:37', '2026-01-06 19:58:37', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (8, 'Moonshine', 9, 11000, 370, 'ml', 29.72972972972973, 1, '2026-03-05 20:15:41', '2026-01-06 19:59:42', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (9, 'Gin Blue', 9, 12000, 750, 'ml', 16, 1, '2026-01-06 19:59:59', '2026-01-06 19:59:59', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (10, 'Agua Tonica', 10, 2800, 1.5, 'l', 1.8666666666666667, 1, '2026-01-06 20:00:37', '2026-01-06 20:00:37', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (11, 'Leche Deslactosada', 10, 1700, 1, 'l', 1.7, 1, '2026-01-06 20:01:36', '2026-01-06 20:01:36', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (12, 'Jengibre', 13, 15157, 1, 'kg', 15.157, 1, '2026-01-06 20:03:34', '2026-01-06 20:03:34', 0, 0);
INSERT INTO raw_materials (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at, stock_quantity, min_stock) VALUES (13, 'Frutos Rojos', 13, 11000, 1, 'kg', 11, 1, '2026-03-05 20:16:07', '2026-01-06 20:04:31', 0, 0);

-- recipes (1 rows)
INSERT INTO recipes (id, name, description, recipe_cost, active, created_at, updated_at) VALUES (1, 'Cortado', 'Doble shot de cafe espresso
Leche texturizada', 1105.4, 1, '2026-01-06 13:39:35', '2026-03-05 20:18:42');

-- recipe_ingredients (3 rows)
INSERT INTO recipe_ingredients (id, recipe_id, raw_material_id, quantity, unit, created_at) VALUES (1, 1, 2, 18, 'gr', '2026-01-06 13:39:35');
INSERT INTO recipe_ingredients (id, recipe_id, raw_material_id, quantity, unit, created_at) VALUES (2, 1, 1, 60, 'ml', '2026-01-06 13:39:35');
INSERT INTO recipe_ingredients (id, recipe_id, raw_material_id, quantity, unit, created_at) VALUES (3, 1, 3, 130, 'ml', '2026-01-06 13:39:35');

-- cost_products (1 rows)
INSERT INTO cost_products (id, name, recipe_id, fixed_cost, fixed_cost_type, preparation_time_minutes, margin_percentage, calculated_cost, suggested_price, rounded_price, active, created_at, updated_at) VALUES (1, 'Cortado', 1, 300, 'per_item', 0, 250, 1405.4, 4918.9, 4920, 1, '2026-01-06 13:43:11', '2026-03-05 20:18:42');

-- fixed_costs: no data

-- stock_products (12 rows)
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (1, 'Medialunas Dulces', 18, 12, 1, '2026-02-28 21:35:44', '2026-03-17 14:16:55');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (2, 'Medialuna Salada', 7, 12, 1, '2026-02-28 21:45:03', '2026-03-13 23:59:34');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (3, 'Croissant', 0, 8, 1, '2026-02-28 21:45:32', '2026-03-16 22:00:12');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (4, 'Pan de chocolate', 4, 4, 1, '2026-02-28 21:45:50', '2026-03-13 21:25:59');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (5, 'Roll de Canela', 4, 4, 1, '2026-02-28 21:46:26', '2026-03-13 22:35:03');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (6, 'Focaccias', 10, 5, 1, '2026-03-14 23:05:36', '2026-03-15 01:35:36');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (7, 'Pan de Papa Salame y Manteca', 26, 5, 1, '2026-03-14 23:06:01', '2026-03-15 03:05:20');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (8, 'Pan de Papa Jamon', 15, 5, 1, '2026-03-14 23:06:21', '2026-03-14 23:06:21');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (9, 'Pan de Papa Caprese', 26, 5, 1, '2026-03-14 23:06:39', '2026-03-15 01:35:36');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (10, 'Sandwich de Ciabatta Salame', 47, 5, 1, '2026-03-14 23:08:48', '2026-03-16 16:00:59');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (11, 'Ciabatta Clasico', 24, 5, 1, '2026-03-14 23:09:16', '2026-03-17 15:56:33');
INSERT INTO stock_products (id, name, current_stock, alert_threshold, active, created_at, updated_at) VALUES (12, 'Pizzetas', 19, 5, 1, '2026-03-14 23:10:05', '2026-03-16 12:28:08');

-- stock_menu_item_map (15 rows)
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (3, 2, 24, '2026-02-28 21:45:03');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (4, 3, 25, '2026-02-28 21:45:33');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (5, 5, 77, '2026-02-28 21:46:26');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (6, 4, 26, '2026-02-28 21:46:44');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (9, 1, 23, '2026-03-07 13:35:44');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (10, 1, 57, '2026-03-07 13:35:44');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (11, 6, 85, '2026-03-14 23:05:36');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (12, 7, 84, '2026-03-14 23:06:01');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (13, 8, 83, '2026-03-14 23:06:21');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (14, 9, 82, '2026-03-14 23:06:39');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (15, 10, 70, '2026-03-14 23:08:48');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (16, 11, 66, '2026-03-14 23:09:16');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (17, 12, 81, '2026-03-14 23:10:05');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (18, 12, 80, '2026-03-14 23:10:05');
INSERT INTO stock_menu_item_map (id, stock_product_id, menu_item_id, created_at) VALUES (19, 12, 79, '2026-03-14 23:10:05');

-- services (6 rows)
INSERT INTO services (id, name, monthly_amount, due_day, category, icon, active, created_at, updated_at) VALUES (1, 'Internet', 0, 10, 'connectivity', 'wifi', 1, '2026-03-10 11:13:52', '2026-03-10 11:13:52');
INSERT INTO services (id, name, monthly_amount, due_day, category, icon, active, created_at, updated_at) VALUES (2, 'Alquiler', 0, 5, 'rent', 'home', 1, '2026-03-10 11:13:52', '2026-03-10 11:13:52');
INSERT INTO services (id, name, monthly_amount, due_day, category, icon, active, created_at, updated_at) VALUES (3, 'API', 0, 1, 'software', 'code', 1, '2026-03-10 11:13:52', '2026-03-10 11:13:52');
INSERT INTO services (id, name, monthly_amount, due_day, category, icon, active, created_at, updated_at) VALUES (4, 'DREI', 0, 15, 'tax', 'receipt', 1, '2026-03-10 11:13:52', '2026-03-10 11:13:52');
INSERT INTO services (id, name, monthly_amount, due_day, category, icon, active, created_at, updated_at) VALUES (5, 'Contadora', 0, 1, 'professional', 'user', 1, '2026-03-10 11:13:52', '2026-03-10 11:13:52');
INSERT INTO services (id, name, monthly_amount, due_day, category, icon, active, created_at, updated_at) VALUES (6, 'Luz', 0, 15, 'utility', 'bolt', 1, '2026-03-10 11:13:52', '2026-03-10 11:13:52');

-- coffees (9 rows)
INSERT INTO coffees (id, name, benefit, origin) VALUES (1, 'Monteverde', 'Lavado', 'Peru');
INSERT INTO coffees (id, name, benefit, origin) VALUES (5, 'House Blend', 'washed', 'Mixto');
INSERT INTO coffees (id, name, benefit, origin) VALUES (6, 'Berkel Pedra Azul', 'washed', 'Brasil');
INSERT INTO coffees (id, name, benefit, origin) VALUES (7, 'Moka', 'washed', 'Brasil');
INSERT INTO coffees (id, name, benefit, origin) VALUES (8, 'P01 Blend ', 'washed', 'Peru');
INSERT INTO coffees (id, name, benefit, origin) VALUES (9, 'Equinoccio ', 'natural', 'ED Limitada');
INSERT INTO coffees (id, name, benefit, origin) VALUES (10, 'Santa Cruz', 'honey', 'Mexico');
INSERT INTO coffees (id, name, benefit, origin) VALUES (11, 'Altiplano ', 'washed', 'Nicaragua');
INSERT INTO coffees (id, name, benefit, origin) VALUES (12, 'Santa Rita - Caturra Pache', 'washed', 'Guatemala');

COMMIT;
PRAGMA foreign_keys = ON;