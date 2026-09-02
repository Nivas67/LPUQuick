# LPUQuick — Post-Rollback Validation Report (POST_ROLLBACK_VALIDATION_REPORT.md)

**Generated At:** 2026-09-02T14:45:50.000+05:30 (IST)  
**Target Cutoff:** `2026-09-02 08:00:00 IST` (`2026-09-02T02:30:00.000Z` UTC)  
**Database URL:** `https://dzygsmgdzvroxepwyjyz.supabase.co`  
**Validation Status:** ✅ 100% PASSED  

---

## 1. Entity Integrity Post-Rollback

| Category | 08:00 AM Target | Current Live State | Result |
| :--- | :--- | :--- | :--- |
| **Users / Customers** | 6 verified users | 6 verified users (`admin_001`, `user_001`, `user_nivas`, `user_jaswanth_varma`, `user_rohit_k`, `user_aman_s`) | **PASS** |
| **Products** | 53 authentic items | 53 items | **PASS** |
| **Inventory / Stock** | Exact stock quantities | Maggi: 45, Lay's: 38, Kurkure: 42, Sting: 30, etc. | **PASS** |
| **Orders** | 8 historical orders | 8 orders (`order_1cd3afdd`, `order_783df829`, `order_4917a421`, etc.) | **PASS** |
| **Order Items** | 35 items | 35 items linked cleanly | **PASS** |
| **Admin Permissions** | `admin_001` role `admin`| Intact with full administrative access | **PASS** |

---

## 2. Foreign Key & Relational Checks
* **Order ➔ User Relations**: Evaluated all 8 orders against active users. Broken references: **0** (100% PASS).
* **Item ➔ Order Relations**: Evaluated all 35 order items against active orders. Broken references: **0** (100% PASS).
* **Item ➔ Product Relations**: Evaluated all 35 order items against active products. Broken references: **0** (100% PASS).
* **Order History Isolation**: Validated that student users only see their own orders. Leaks: **0** (100% PASS).

---

## 3. End-to-End Application Testing
* **Localhost API**: `GET http://localhost:3000/api/products` ➔ **HTTP 200** (53 products streaming from Supabase).
* **Admin Order Stream**: `GET http://localhost:3000/api/orders/admin/all` ➔ **HTTP 200** (8 orders loaded).
* **Vercel Production**: `GET https://lpu-quick.vercel.app/api/products` ➔ **HTTP 200** (53 products loaded).
