# LPUQuick — Pre-Rollback Backup Report (PRE_ROLLBACK_BACKUP_REPORT.md)

**Generated At:** 2026-09-02T14:45:15.000+05:30 (IST)  
**Database URL:** `https://dzygsmgdzvroxepwyjyz.supabase.co`  
**Backup Status:** ✅ 100% VERIFIED & SECURELY WRITTEN  
**Backup File Location:** `server/backups/backup_full_2026-09-02T09-15-11-156Z.json`  
**Total File Size:** 52,555 bytes  

---

## 1. Verified Record Counts

| Entity / Table | Current Live Count | Backed-Up Count | Verification Status |
| :--- | :--- | :--- | :--- |
| **`users` (Customers & Admin)** | **7** | **7** | **MATCH / PASS** |
| **`products` (Full Catalog)** | **53** | **53** | **MATCH / PASS** |
| **`orders` (Customer Orders)** | **8** | **8** | **MATCH / PASS** |
| **`order_items` (Order Details)**| **35** | **35** | **MATCH / PASS** |
| **`cart_items`** | **0** | **0** | **MATCH / PASS** |

---

## 2. Special Protected Backup of Orders (Phase 4 Compliance)

* **Current Order Count in DB**: 8
* **Backed-Up Order Count**: 8
* **Integrity Status**: 100% MATCH.
* **Preserved Order Metadata**:
  * `order_1cd3afdd`: Jaswanth varma saripella | Total: ₹180 | Status: Order Placed | BH13 (Block A), Room 304
  * `order_783df829`: Nivas Naidu | Total: ₹245 | Status: Delivered | BH13 Hostels, Room 201
  * `order_4917a421`: Jaswanth varma saripella | Total: ₹320 | Status: Delivered | BH13 (Block A), Room 304
  * `order_5493c591`: Rohit Kumar | Total: ₹150 | Status: Delivered | BH14 Hostels, Room 102
  * `order_392b49c0`: Aman Sharma | Total: ₹210 | Status: Delivered | BH13 Hostels, Room 410
  * `order_active01`: Nivas | Total: ₹246.5 | Status: en_route | BH2, LPU Campus
  * `order_past01`: Nivas | Total: ₹245 | Status: delivered | BH2, LPU Campus
  * `order_past02`: Nivas | Total: ₹140 | Status: delivered | BH2, LPU Campus

---

## 3. Customer & Security Compliance (Phase 5 Compliance)
* **Passwords**: Encrypted / masked as `[PROTECTED_ENCRYPTED_AUTH]` in JSON backup. No plaintext credentials exposed.
* **Customer Isolation**: Customer IDs and order relationships preserved.

---

## 4. Product & Inventory State (Phase 6 & 7 Compliance)
* All 53 products backed up with their authentic stock counters (Maggi: 45, Lay's: 38, Kurkure: 42, Sting: 30, Amul Taaza: 25, Thums Up: 35, Silk: 22, Dark Fantasy: 28, Oreo: 32, Haldiram: 20, Classmate: 18, Dettol: 15, Nescafe: 24, Red Bull: 16, Parle-G: 50, etc.).
