# LPUQuick — Rollback Discovery Report (ROLLBACK_DISCOVERY_REPORT.md)

**Generated At:** 2026-09-02T14:44:30.000+05:30 (IST)  
**Target Rollback Time:** `2026-09-02 08:00:00 IST` (Equivalent to `2026-09-02T02:30:00.000Z` UTC)  
**Database Connection:** Supabase Cloud PostgreSQL (`https://dzygsmgdzvroxepwyjyz.supabase.co`)  
**Status:** Discovery Complete & Non-Destructive  

---

## 1. Database & Project Infrastructure

* **Host / Cloud**: Supabase Cloud (AWS Infrastructure)
* **PostgreSQL Engine**: PostgreSQL 15+
* **Database Timezone**: `UTC` (Target `08:00:00 IST` converts to `02:30:00 UTC`)
* **Client Access**: `@supabase/supabase-js` using `service_role_key` (Backend Secure)
* **Point-in-Time Recovery (PITR) Availability**: **UNAVAILABLE** (Supabase Hobby/Free tier does not support continuous WAL archiving or PITR; PITR requires Pro plan with $100/mo add-on).
* **Rollback Method Selected**: **Deterministic Snapshot & Logical Reversion (Phase 2 Compliance)**. Because native PITR is unavailable on the free plan, a logical rollback with verified full backups must be used to preserve all authentic historical data while removing post-08:00 AM artifacts.

---

## 2. Table Schema & Column Discovery

| Table Name | Primary Key | Foreign Keys | Timestamp Columns | Row Count |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `id` | None | `created_at`, `blocked_at` | **7** |
| **`products`** | `id` | None | `created_at` | **53** |
| **`orders`** | `id` | `user_id` ➔ `users.id` | `created_at` | **8** |
| **`order_items`** | `id` | `order_id` ➔ `orders.id`, `product_id` ➔ `products.id` | None | **35** |
| **`cart_items`** | `id` | `user_id` ➔ `users.id`, `product_id` ➔ `products.id` | None | **0** |

---

## 3. Post-08:00 AM Discovered Modifications

1. **`users` Table**:
   * Pre-08:00 AM Users: `admin_001`, `user_001` (Nivas), `user_nivas`, `user_jaswanth_varma`, `user_rohit_k`, `user_aman_s`.
   * Post-08:00 AM Extraneous Record: `audit_alert_1788337885864` (Created at `2026-09-02T08:31:25Z` during security alert script tests). Needs safe removal.
2. **`orders` Table**:
   * All **8 orders** (`order_1cd3afdd`, `order_783df829`, `order_4917a421`, `order_5493c591`, `order_392b49c0`, `order_active01`, `order_past01`, `order_past02`) have creation timestamps dated **between October 2025 and August 31, 2026**.
   * **0 new customer orders** were placed after 08:00 AM IST today.
3. **`products` Table**:
   * 53 products currently present. 15 core campus favorites from morning snapshot + 38 general store items.
4. **`order_items` Table**:
   * 35 line items mapped to the 8 orders.

---

## 4. Discovery Conclusion & Next Steps
* Discovery completed without any modifications or deletions.
* Proceeding immediately to **Phase 3 — Full Backup** before any rollback action.
