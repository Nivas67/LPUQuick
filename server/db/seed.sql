-- LPUQuick Seed Data

-- Demo User (matches Settings screen: Nivas, 7671836211, 04 Aug 2006)
INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, dob) VALUES
('user_001', 'Nivas', 'nivas@lpu.in', '7671836211', 'demo_hash_123', '2006-08-04');

-- ============================================================
-- PRODUCTS: Morning Essentials (6AM-10AM)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_m01', 'Amul Toned Milk', 'Grocery', 'Dairy', 30, 32, 'pack', '500ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCm03ACbpBaoSankZxkvWMgBPKz2uzT1ZpvqP-mlvZlA_fb6m5Gl_ITrkIkvwtD5WaHEx_Ggfv3Qd9Lza4ddSMsuCzhbctDeNqunb_QKIi9Nb_dm_NXmMEYzwPDXjFPiDwvma-M77IjasLys7mf8-hI1clW1tkyarPLD-Wumw0C-6cv3ZBzQJMAIEbxkwD_1swpbTAHc1KEN_RmllBy0sv4hKjugjlZ3dtRfmY1DzSh1RTDYMmgFPw', 'Fresh toned milk carton on a light surface', 'morning,dairy,milk,essential', 1, 1, 0),
('prod_m02', 'Brown Bread', 'Grocery', 'Bakery', 45, 50, 'pack', '400g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'Fresh brown bread loaf', 'morning,bakery,bread,essential', 1, 0, 0),
('prod_m03', 'Farm Fresh Eggs', 'Grocery', 'Dairy', 85, 90, 'tray', '6 pcs', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADDjNKDe6Qi6eLRwkIOm46x_JhxbV32NTOGvLUfHQJ9kDCzrfQVKKenyucMAYq0oyXnxXfo9ntsahzkT-rYVI2p_W_plSvD7XkwDIRDRRAZMgr7ul9eiFr72we4QwqDqNo1n1aoYRrdCFYjQyssn4rYEQW5nmZl1t_KlojpnJdWqebK9U-3et3O3GFA5f0J3t6eHU9G_nAXoxSRQlpHxLUT36wk4n5b8v2nFEPV1PZzkb-1A3K6LQ', 'Fresh eggs in a tray', 'morning,dairy,eggs,protein', 1, 0, 0),
('prod_m04', 'Orange Juice', 'Snacks & Beverages', 'Beverages', 65, 70, 'bottle', '1L', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGqQv9EqR1veqN1lK2OvoUjr21cZNCsLrxKDZTui1SuKUKNB-W_27uP3LVMQUNBkoXDjHZjZXoWluIGHSG4_JTGWWHPG9nKy3_wy7axizNR7_CwxSXdhJ85Kdym9plYxyyc6TMayz33tQsNp9ZFj6Y3EtjhMx7Ra7QITasCar74sCBGcRzOPIYV2-6xGFSWji9FDGuLtx4SDfhYznYJgo_0amlOiU5S6iA5RbbESCFF4j3AT0tKJw', 'Bottle of fresh orange juice', 'morning,beverage,juice,fresh', 1, 0, 1);

-- ============================================================
-- PRODUCTS: Evening Snacks (matches Home Screen Stitch design)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_s01', 'Instant Noodles', 'Snacks & Beverages', 'Snacks', 15, 18, 'pack', '70g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD40YlBRnZOkJ3pbPr-Sp5vt_bSrFXiM134COz7UR01ogchon77fS3midfVkb5MabJk6jXfpnj-qUPpjgGiZzOanbSehDGnEdK7BXWpx9-tGy6FdAG4P9YUPNu_p2A8KhuKm26yHej8iGmYXzYLcHCMQnl7t9bk05SFCZoXu9QdHUsOUs52YcQSfQDbEgC5ebBwztgGWxRdimou-tkkrL4BSqVaQ2CR46Nbx86a6ghxr0gCm-RVmDU', 'A bowl of hot steaming instant noodles with herbs on top', 'evening,snack,noodles,quick', 1, 1, 0),
('prod_s02', 'Choco Cookies', 'Snacks & Beverages', 'Snacks', 40, 45, 'pack', '250g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoAk0bG9DUQOs7yFQqZszPd7lHXyFIuMV8eoi9Gvhb98K0Tj7VBnqifqBd4JVxaA3viXhM4_7oX7j39WHXbAjMhaqClrG3zn953zjX9R-58nY5UIS9B4yvMX5Uvf4KKan0IUeq-yOKuOHE-xGCV6SgWfCl_EidYto_UbR_DXLUYJdQxZ-se6KGwDLo1oASiT2Is2CVXvXPyCZgRa3FEUvqEawUBjm7eetOcB9wjurDtrgyUt64nX0', 'A pack of dark chocolate cookies', 'evening,snack,cookies,chocolate', 1, 0, 0),
('prod_s03', 'Mixed Fruit Juice', 'Snacks & Beverages', 'Beverages', 55, 60, 'bottle', '1L', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGqQv9EqR1veqN1lK2OvoUjr21cZNCsLrxKDZTui1SuKUKNB-W_27uP3LVMQUNBkoXDjHZjZXoWluIGHSG4_JTGWWHPG9nKy3_wy7axizNR7_CwxSXdhJ85Kdym9plYxyyc6TMayz33tQsNp9ZFj6Y3EtjhMx7Ra7QITasCar74sCBGcRzOPIYV2-6xGFSWji9FDGuLtx4SDfhYznYJgo_0amlOiU5S6iA5RbbESCFF4j3AT0tKJw', 'A bottle of fruit juice vibrant orange color', 'evening,beverage,juice,fruit', 1, 0, 1),
('prod_s04', 'Roasted Almonds', 'Snacks & Beverages', 'Snacks', 120, 140, 'pack', '200g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADDjNKDe6Qi6eLRwkIOm46x_JhxbV32NTOGvLUfHQJ9kDCzrfQVKKenyucMAYq0oyXnxXfo9ntsahzkT-rYVI2p_W_plSvD7XkwDIRDRRAZMgr7ul9eiFr72we4QwqDqNo1n1aoYRrdCFYjQyssn4rYEQW5nmZl1t_KlojpnJdWqebK9U-3et3O3GFA5f0J3t6eHU9G_nAXoxSRQlpHxLUT36wk4n5b8v2nFEPV1PZzkb-1A3K6LQ', 'A small bag of roasted almonds', 'evening,snack,nuts,healthy', 1, 0, 0);

-- ============================================================
-- PRODUCTS: Buy Again items (matches Home Screen)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_b01', 'Spicy Chips', 'Snacks & Beverages', 'Snacks', 20, 25, 'pack', '100g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6pk1u3i-8IsDcuolgrFKT5VWeNYNhrBJPFyhiwOs_ShY9sHKq7nxHuqeqP_F7hpoB0ZFvMl4A4vLhN6W9vIxHdIOPbyaw7PpGagxKnfOocB9DreU86S741XGFX7YglJpywRILEN4u1MdVrepVcuOQaadcbb8Nohqsx1Qq4o7TM0WjY86u7fSmC5O1ogkR4FYumpPW4e4GRvDU2dlSrryhszymX_MB4GMYOQOU3Med7Z8JE1_SeQc', 'A small packet of branded spicy potato chips', 'snack,chips,spicy,buyagain', 1, 0, 0),
('prod_b02', 'Cold Coffee', 'Snacks & Beverages', 'Beverages', 45, 50, 'can', '250ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLWhsioj_hVxs-in5cZzy_SEQtSw2dwdtfIBhAeftEyefmSjoh9e8-734niNIl4G_-hlIQkB54DAQAWicMj8IRgcKk9kjm5kCYNNXe0cAPj39SxXqpyvIxuCWthqux12jyWTRf2Ngv9iAOGMxektii6qv6JdhPycU8rb-7IRE9wjyjebvUjblNysZldZ7Yku8FK3AabgJosC-WElMADKgC6Cvo7G7CAXZJf0f8ZlTlIGP8ZW2UywY', 'A refreshing can of cold coffee with condensation drops', 'beverage,coffee,cold,buyagain', 1, 0, 0),
('prod_b03', 'Green Apple', 'Grocery', 'Fruits', 30, 35, 'piece', '1 pc', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCm03ACbpBaoSankZxkvWMgBPKz2uzT1ZpvqP-mlvZlA_fb6m5Gl_ITrkIkvwtD5WaHEx_Ggfv3Qd9Lza4ddSMsuCzhbctDeNqunb_QKIi9Nb_dm_NXmMEYzwPDXjFPiDwvma-M77IjasLys7mf8-hI1clW1tkyarPLD-Wumw0C-6cv3ZBzQJMAIEbxkwD_1swpbTAHc1KEN_RmllBy0sv4hKjugjlZ3dtRfmY1DzSh1RTDYMmgFPw', 'A fresh green apple', 'fruit,apple,fresh,buyagain', 1, 0, 0),
('prod_b04', 'Protein Bar', 'Snacks & Beverages', 'Snacks', 60, 70, 'bar', '60g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'A packaged protein bar with vibrant wrapper', 'snack,protein,healthy,buyagain', 1, 0, 0);

-- ============================================================
-- PRODUCTS: Lunch Prep (10AM-2PM)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_l01', 'Basmati Rice', 'Grocery', 'Staples', 95, 110, 'pack', '1kg', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADDjNKDe6Qi6eLRwkIOm46x_JhxbV32NTOGvLUfHQJ9kDCzrfQVKKenyucMAYq0oyXnxXfo9ntsahzkT-rYVI2p_W_plSvD7XkwDIRDRRAZMgr7ul9eiFr72we4QwqDqNo1n1aoYRrdCFYjQyssn4rYEQW5nmZl1t_KlojpnJdWqebK9U-3et3O3GFA5f0J3t6eHU9G_nAXoxSRQlpHxLUT36wk4n5b8v2nFEPV1PZzkb-1A3K6LQ', 'Basmati rice pack', 'lunch,staple,rice', 1, 1, 0),
('prod_l02', 'Toor Dal', 'Grocery', 'Staples', 75, 80, 'pack', '500g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'Toor dal pack', 'lunch,staple,dal,lentils', 1, 0, 0),
('prod_l03', 'Fresh Tomatoes', 'Grocery', 'Vegetables', 25, 30, 'pack', '500g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7osu9mbU_msDyC10yJjFs8nYZdfevk0uleGVufjVYyunYlQLy6KIqhk12OeWGCv9P-TB4P5LR9EVD44zqlC1Zgw7RGKP6NbXt28-3AX0h9kMmp1yXu7Quq1a6kEdgq0Pc--vNOUCEauJd86VpJU-Kd4SYr-ioZOP9_ljIxRZEtdsws0sT4G89wQzoZLEV4P-g_bAeQ0pSAr1FqNC5-8_a-U-ecUa-9EPvnICO_fhmVZUGrHVVs7w', 'Fresh tomatoes', 'lunch,vegetable,tomato,fresh', 1, 0, 0),
('prod_l04', 'Cooking Oil', 'Grocery', 'Staples', 110, 125, 'bottle', '1L', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGqQv9EqR1veqN1lK2OvoUjr21cZNCsLrxKDZTui1SuKUKNB-W_27uP3LVMQUNBkoXDjHZjZXoWluIGHSG4_JTGWWHPG9nKy3_wy7axizNR7_CwxSXdhJ85Kdym9plYxyyc6TMayz33tQsNp9ZFj6Y3EtjhMx7Ra7QITasCar74sCBGcRzOPIYV2-6xGFSWji9FDGuLtx4SDfhYznYJgo_0amlOiU5S6iA5RbbESCFF4j3AT0tKJw', 'Cooking oil bottle', 'lunch,staple,oil,cooking', 1, 0, 0);

-- ============================================================
-- PRODUCTS: Midnight Cravings (10PM-2AM)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_n01', 'Instant Maggi Pack', 'Snacks & Beverages', 'Snacks', 56, 60, 'pack', '4-pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD40YlBRnZOkJ3pbPr-Sp5vt_bSrFXiM134COz7UR01ogchon77fS3midfVkb5MabJk6jXfpnj-qUPpjgGiZzOanbSehDGnEdK7BXWpx9-tGy6FdAG4P9YUPNu_p2A8KhuKm26yHej8iGmYXzYLcHCMQnl7t9bk05SFCZoXu9QdHUsOUs52YcQSfQDbEgC5ebBwztgGWxRdimou-tkkrL4BSqVaQ2CR46Nbx86a6ghxr0gCm-RVmDU', 'Instant noodles pack', 'midnight,snack,instant,quick', 1, 1, 0),
('prod_n02', 'Ice Cream Tub', 'Snacks & Beverages', 'Frozen', 150, 180, 'tub', '500ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoAk0bG9DUQOs7yFQqZszPd7lHXyFIuMV8eoi9Gvhb98K0Tj7VBnqifqBd4JVxaA3viXhM4_7oX7j39WHXbAjMhaqClrG3zn953zjX9R-58nY5UIS9B4yvMX5Uvf4KKan0IUeq-yOKuOHE-xGCV6SgWfCl_EidYto_UbR_DXLUYJdQxZ-se6KGwDLo1oASiT2Is2CVXvXPyCZgRa3FEUvqEawUBjm7eetOcB9wjurDtrgyUt64nX0', 'Ice cream tub', 'midnight,dessert,icecream,frozen', 1, 0, 1),
('prod_n03', 'Energy Drink', 'Snacks & Beverages', 'Beverages', 70, 75, 'can', '250ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLWhsioj_hVxs-in5cZzy_SEQtSw2dwdtfIBhAeftEyefmSjoh9e8-734niNIl4G_-hlIQkB54DAQAWicMj8IRgcKk9kjm5kCYNNXe0cAPj39SxXqpyvIxuCWthqux12jyWTRf2Ngv9iAOGMxektii6qv6JdhPycU8rb-7IRE9wjyjebvUjblNysZldZ7Yku8FK3AabgJosC-WElMADKgC6Cvo7G7CAXZJf0f8ZlTlIGP8ZW2UywY', 'Energy drink can', 'midnight,beverage,energy', 1, 0, 0),
('prod_n04', 'Cup Noodles', 'Snacks & Beverages', 'Snacks', 45, 50, 'cup', '70g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD40YlBRnZOkJ3pbPr-Sp5vt_bSrFXiM134COz7UR01ogchon77fS3midfVkb5MabJk6jXfpnj-qUPpjgGiZzOanbSehDGnEdK7BXWpx9-tGy6FdAG4P9YUPNu_p2A8KhuKm26yHej8iGmYXzYLcHCMQnl7t9bk05SFCZoXu9QdHUsOUs52YcQSfQDbEgC5ebBwztgGWxRdimou-tkkrL4BSqVaQ2CR46Nbx86a6ghxr0gCm-RVmDU', 'Cup noodles', 'midnight,snack,noodles,instant', 1, 0, 0);

-- ============================================================
-- PRODUCTS: Afternoon Pick-Me-Up (2PM-6PM)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_a01', 'Iced Tea', 'Snacks & Beverages', 'Beverages', 35, 40, 'bottle', '350ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLWhsioj_hVxs-in5cZzy_SEQtSw2dwdtfIBhAeftEyefmSjoh9e8-734niNIl4G_-hlIQkB54DAQAWicMj8IRgcKk9kjm5kCYNNXe0cAPj39SxXqpyvIxuCWthqux12jyWTRf2Ngv9iAOGMxektii6qv6JdhPycU8rb-7IRE9wjyjebvUjblNysZldZ7Yku8FK3AabgJosC-WElMADKgC6Cvo7G7CAXZJf0f8ZlTlIGP8ZW2UywY', 'Iced tea bottle', 'afternoon,beverage,tea,cold', 1, 0, 1),
('prod_a02', 'Marie Biscuits', 'Snacks & Beverages', 'Snacks', 25, 30, 'pack', '200g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoAk0bG9DUQOs7yFQqZszPd7lHXyFIuMV8eoi9Gvhb98K0Tj7VBnqifqBd4JVxaA3viXhM4_7oX7j39WHXbAjMhaqClrG3zn953zjX9R-58nY5UIS9B4yvMX5Uvf4KKan0IUeq-yOKuOHE-xGCV6SgWfCl_EidYto_UbR_DXLUYJdQxZ-se6KGwDLo1oASiT2Is2CVXvXPyCZgRa3FEUvqEawUBjm7eetOcB9wjurDtrgyUt64nX0', 'Marie biscuits pack', 'afternoon,snack,biscuit', 1, 0, 0),
('prod_a03', 'Banana', 'Grocery', 'Fruits', 10, 12, 'piece', '1 pc', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7osu9mbU_msDyC10yJjFs8nYZdfevk0uleGVufjVYyunYlQLy6KIqhk12OeWGCv9P-TB4P5LR9EVD44zqlC1Zgw7RGKP6NbXt28-3AX0h9kMmp1yXu7Quq1a6kEdgq0Pc--vNOUCEauJd86VpJU-Kd4SYr-ioZOP9_ljIxRZEtdsws0sT4G89wQzoZLEV4P-g_bAeQ0pSAr1FqNC5-8_a-U-ecUa-9EPvnICO_fhmVZUGrHVVs7w', 'Fresh banana', 'afternoon,fruit,banana,fresh', 1, 1, 0),
('prod_a04', 'Mango Lassi', 'Snacks & Beverages', 'Beverages', 50, 55, 'cup', '300ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGqQv9EqR1veqN1lK2OvoUjr21cZNCsLrxKDZTui1SuKUKNB-W_27uP3LVMQUNBkoXDjHZjZXoWluIGHSG4_JTGWWHPG9nKy3_wy7axizNR7_CwxSXdhJ85Kdym9plYxyyc6TMayz33tQsNp9ZFj6Y3EtjhMx7Ra7QITasCar74sCBGcRzOPIYV2-6xGFSWji9FDGuLtx4SDfhYznYJgo_0amlOiU5S6iA5RbbESCFF4j3AT0tKJw', 'Mango lassi cup', 'afternoon,beverage,lassi,mango', 1, 0, 1);

-- ============================================================
-- PRODUCTS: Personal Care, Pharmacy, Stationery, Electronics
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_pc01', 'Face Wash', 'Personal Care', 'Skincare', 125, 150, 'tube', '100ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9XTkc0Vv5nIYqz089TG5ZtWXcNFIy6g89LUnJprNyv548dK7TJbbIhx6lFbRs1laX6gMH4E9vsC4gQwKrRKDsbwk0b8T9fWq-GaYRsCyoo7bMHfCt1mad8ENpTCP1KMA8apywFZpAFzl6q3QNRsw5wSgy4rmHCOsQI98R1GSoPdniPhOCodrWvY489mxNO3RVa-5scWt11lj7AepbFNjLWBoIMz3QCjW7icxI46aSM4Ibe7DO31U', 'Premium face wash tube', 'personalcare,skincare,facewash', 1, 0, 1),
('prod_pc02', 'Toothpaste', 'Personal Care', 'Oral Care', 55, 60, 'tube', '150g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9XTkc0Vv5nIYqz089TG5ZtWXcNFIy6g89LUnJprNyv548dK7TJbbIhx6lFbRs1laX6gMH4E9vsC4gQwKrRKDsbwk0b8T9fWq-GaYRsCyoo7bMHfCt1mad8ENpTCP1KMA8apywFZpAFzl6q3QNRsw5wSgy4rmHCOsQI98R1GSoPdniPhOCodrWvY489mxNO3RVa-5scWt11lj7AepbFNjLWBoIMz3QCjW7icxI46aSM4Ibe7DO31U', 'Toothpaste tube', 'personalcare,oralcare,toothpaste', 1, 1, 0),
('prod_ph01', 'Paracetamol', 'Pharmacy', 'Medicine', 18, 20, 'strip', '10 tabs', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'Paracetamol strip', 'pharmacy,medicine,fever,pain', 1, 0, 0),
('prod_ph02', 'Band-Aid Box', 'Pharmacy', 'First Aid', 35, 40, 'box', '20 pcs', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'Band-aid box', 'pharmacy,firstaid,bandaid', 1, 0, 0),
('prod_st01', 'Notebook A4', 'Stationery', 'Notebooks', 40, 50, 'piece', '200 pages', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'A4 notebook', 'stationery,notebook,writing', 1, 0, 0),
('prod_st02', 'Gel Pens Pack', 'Stationery', 'Pens', 80, 90, 'pack', '5 pcs', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'Gel pens pack', 'stationery,pens,writing', 1, 0, 0),
('prod_el01', 'USB-C Cable', 'Electronics', 'Cables', 199, 250, 'piece', '1m', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8vm1wNChu-tMRWh7RjjoVZ2mlKHMRTF4CJVDD3Nf3d0ME_j8FR1AunKAlKKE6FbTEwMtkMvO2sJrc5lJYISNEZiDsgRCJ5cq9gONb_iHK19tijC_9tKygj_dYbbZSDzKH9azPgf2gOrc_JLOsHT5J39tGWnxIvjlAJvoiAw72PjERgfJKz9DvonMz_xqVR_-VtFYhyQsH_uz7a9O3w915jqCAotgxL9ZZLuh-4q8xuaq4pCacN8M', 'USB-C cable', 'electronics,cable,usbc,charging', 1, 0, 1),
('prod_el02', 'Earphones', 'Electronics', 'Audio', 299, 350, 'piece', '1 pc', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUTxmIoGgl7rbslBzkzseWqGghh3_PHas9_j6ykiN1EDbdVaTteWCdupY-4Md5-KXxJ2Ds54tcDd6KRfFaCtjO2GeaOukMedhZbaH6zUjYTdRq4yxIyR_bIiQNo6Mp8hF0_jzoVj7trG33NI8SM751eVgCf3nAcZSYUUYT-a34cMHtd8s7AGyENKAXFzABIC0u-0yTm2PkNQAEdhIHiGFDMmOWlxwl707uWvu8_3oqv_ah6093uAI', 'Wireless earphones', 'electronics,audio,earphones', 1, 0, 0);

-- ============================================================
-- PRODUCTS: Flow Assist Bundle items (matches Flow Assist screen)
-- ============================================================
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_f01', 'Classic Cola', 'Snacks & Beverages', 'Beverages', 60, 65, 'bottle', '2L', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWj4GYR9sL5Ym5uemKw-AAMJVk5ynOLqQAOKi_vr6pN28uAjignjLtQBBj2N52p-h_uyf5gT7HPsMfiQgDn7upmFJSOBuunfU4JqCcWqeHc0lam_VIzSFozy8C6fYH-UbTqjXMNRnOAxidutsKCiMGk9T1v7_nfADhQZOgniIms8hyIrCrAbQ7dymIns-fdUxHBLfYmiP4C87Y9fy1F6aRZ7UT_snt4opJeM_1qWDvHoMYkB3dj9M', 'A cold condensation covered 2 liter bottle of dark cola soda', 'snack,beverage,cola,party,match', 1, 0, 0),
('prod_f02', 'Spicy Nachos', 'Snacks & Beverages', 'Snacks', 85, 95, 'pack', 'Party Size', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_zIOslVn01xUBPTDi-riNyW-Xb6F5s6dedAauK-iDIrUNwGEAe3EK9AAIJv_TZNn9t1l99EagggCXZ6CTo_pngQytyUWt1TJG7BFZyLY3CAzXU0cZHHrePxc-wofVVInypti4XG4Cga-YjMnTdy4nvv5LoD4acBm_QN3LZDxr0fkGaBWO5BLSZfgSYh17d_P7lEhj9JU5YJsyj3qFvir1CObCTF3p6UZKkDSx6LbM8RJBbNcdSAM', 'A large bag of cheesy nachos tortilla chips', 'snack,nachos,spicy,party,match', 1, 0, 0),
('prod_f03', 'Chunky Salsa', 'Snacks & Beverages', 'Dips', 75, 85, 'jar', 'Medium Heat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8FwQOhwFWRh_QnLKtKoqFV1rhRTsc9RZNzjWQCa3Nwxjy5Kt6r0mb5p4U1Za0n0OInqOAtGqMUamP2XfIn8VS1y5LfmqTzGf2BG9nOa_pX4Q6Lf6KS2eV81LMRsqjK08xT9uE9-nfXzm5KfRggSmpzF-wnQ3z2lR2PwGUi4MjhK0Rlz1ldozeAHEnUuT8oL0w8uaCfslugw48uGUxWUdB-73c080SnbLg3VjMeBVKdvlycRF2LdU', 'A glass jar of thick spicy chunky tomato salsa', 'snack,salsa,dip,party,match', 1, 0, 0),
('prod_f04', 'Choc Cookies Party', 'Snacks & Beverages', 'Snacks', 90, 100, 'box', '12 Pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhoDcdVeuZHn2N4ZEGd3ZwsuO4Jy-Gw4E66q8U3XucMgoSD33XrmPMYYJEAy2xDSuP3t_auiwWyQrY9b77M-CPFYC0hMlw8y4CsqIMoXO5LEHczCDqsAe7YFf2-h5x5kRRXiF9jpVVvKiIPFT-ZuH-Ecj4eZpToIg4ln-EQItVyFUnuSR-oe6zDRAiWOsOz8iy2BFipRe1V0tmTvLsuNyb9Tzmumh83svYHX9GJSFvk3flA-RlBrY', 'A premium box of chocolate chip cookies', 'snack,cookies,chocolate,party,match', 1, 0, 0);

-- Out-of-stock items for smart substitution testing
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new) VALUES
('prod_oos01', 'Lay''s Classic Chips', 'Snacks & Beverages', 'Snacks', 20, 25, 'pack', '100g', '', 'Classic chips', 'snack,chips,classic', 0, 0, 0),
('prod_oos02', 'Amul Full Cream Milk', 'Grocery', 'Dairy', 35, 38, 'pack', '500ml', '', 'Full cream milk', 'dairy,milk,fullcream', 0, 0, 0);

-- ============================================================
-- SAMPLE ORDERS (matches Orders screen)
-- ============================================================
INSERT OR IGNORE INTO orders (id, user_id, status, subtotal, delivery_fee, platform_fee, tax, total, payment_method, payment_status, rider_name, rider_lat, rider_lng, created_at) VALUES
('order_active01', 'user_001', 'en_route', 230, 0, 5, 11.5, 246.5, 'upi', 'paid', 'Alex', 31.2540, 75.7050, datetime('now')),
('order_past01', 'user_001', 'delivered', 200, 30, 5, 10, 245, 'upi', 'paid', 'Rahul', 0, 0, '2025-10-24T14:30:00'),
('order_past02', 'user_001', 'delivered', 100, 30, 5, 5, 140, 'card', 'paid', 'Priya', 0, 0, '2025-10-21T10:15:00');

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
('oi_a01', 'order_active01', 'prod_s02', 2, 40),
('oi_a02', 'order_active01', 'prod_s03', 1, 55),
('oi_a03', 'order_active01', 'prod_s04', 1, 120),
('oi_p01', 'order_past01', 'prod_s01', 3, 15),
('oi_p02', 'order_past01', 'prod_b01', 2, 20),
('oi_p03', 'order_past02', 'prod_ph01', 2, 18),
('oi_p04', 'order_past02', 'prod_ph02', 1, 35);

-- Default cart items for demo
INSERT OR IGNORE INTO cart_items (id, user_id, product_id, quantity) VALUES
('cart_001', 'user_001', 'prod_s02', 2),
('cart_002', 'user_001', 'prod_s03', 1);
