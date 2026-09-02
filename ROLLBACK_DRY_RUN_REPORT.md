# LPUQuick — Rollback Dry Run Report (ROLLBACK_DRY_RUN_REPORT.md)

**Generated At:** 2026-09-02T14:45:30.000+05:30 (IST)  
**Target Rollback State:** `2026-09-02 08:00:00 IST` (`2026-09-02T02:30:00.000Z` UTC)  
**Evaluation Mode:** Simulated Non-Destructive Dry Run  

---

## 1. Table-by-Table Impact Analysis

| Table Name | Current Count | 08:00 Target State | Records Affected | Action | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`users`** | **7** | **6** | 1 (`audit_alert_*`) | Remove synthetic test record | **ZERO RISK** |
| **`products`** | **53** | **53** | 0 | Retain all 53 authentic products | **ZERO RISK** |
| **`orders`** | **8** | **8** | 0 | Retain all 8 pre-08:00 historical orders | **ZERO RISK** |
| **`order_items`** | **35** | **35** | 0 | Retain all valid order-product line items | **ZERO RISK** |
| **`cart_items`** | **0** | **0** | 0 | Retain clean initial state | **ZERO RISK** |

---

## 2. Foreign Key & Relational Verification During Dry Run
* **Orders ➔ Users**: All 8 orders point to legitimate users (`user_jaswanth_varma`, `user_nivas`, `user_rohit_k`, `user_aman_s`, `user_001`). None point to `audit_alert_*`.
* **Order Items ➔ Orders & Products**: All 35 line items point to valid orders and valid products.
* **Integrity Guarantee**: Executing this rollback will produce **0 foreign key violations** and **0 orphan rows**.

---

## 3. Dry Run Conclusion
* Pre-flight checks passed completely.
* Proceeding to Phase 12 (Final Safety Check) and Phase 13 (Execution).
