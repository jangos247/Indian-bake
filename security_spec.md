# Security Specification & Hardened Firestore Audit — Indian Bakery & Cafe

## 1. Data Invariants
1. **Menu & Store Settings (`/settings/{settingId}`, `/products/{productId}`)**: Publicly readable for browsing, strictly writable/deletable only by verified, whitelisted owners (`isAdminEmail()`). Server timestamps (`request.time`) enforced on all mutations.
2. **Customer Orders (`/orders/{orderId}`)**: Strictly isolated by `customerId == request.auth.uid` or `isAdminEmail()`. Customers can only create orders with `stage == 'confirmed'`, non-verified payment status (`pending` or `verification_pending`), positive `subtotal > 0`, bounded `discount <= subtotal`, positive `total >= subtotal - discount + tax + deliveryFee + tip - 1`, and validated `items[0]` & `customer` map schemas. Terminal `'delivered'` stage blocks further kitchen stage edits while allowing `paymentStatus` settlement.
3. **Private Customer Profiles (`/users/{userId}`)**: PII (`email`, `phone`, `streetAddress`, `savedAddresses`) strictly gated to `request.auth.uid == userId` or `isAdminEmail()`. Arrays (`wishlist`, `savedAddresses`) are strictly bounded and first-element typed.
4. **Authorized Owners (`/owners/{ownerId}`)**: Dynamic owner docs keyed by `emailToId(email)`, readable only by owners or the matching verified email user, immutable via update (`allow update: if false`), and bootstrapped owner accounts cannot be deleted.
5. **Product Reviews (`/reviews/{reviewId}`)**: Publicly readable; creation requires verified customer matching `authorId == request.auth.uid`, integer `rating` 1..5, and server timestamp.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Order Total Tampering (`total: 0`)**: Customer submits `{ subtotal: 680, discount: 0, total: 0, ... }` → Rejected by `data.total > 0` and mathematical lower-bound check.
2. **Negative/Excess Discount (`discount: 9999`)**: Customer submits `{ subtotal: 500, discount: 9999, total: 10 }` → Rejected by `data.discount <= data.subtotal`.
3. **Customer Map Shadow Injection**: Order `customer` contains `{ fullName: "A", ..., isVip: true }` → Rejected by `data.customer.keys().hasOnly(...)`.
4. **Item Quantity Poisoning**: Order `items[0]` has `{ quantity: 0 }` or `{ quantity: -5 }` or `{ unitPrice: 0 }` → Rejected by `items[0].quantity is int && items[0].quantity >= 1 && items[0].unitPrice > 0`.
5. **Client-Spoofed Verified Payment**: Customer creates order with `paymentStatus: 'paid'` or `stage: 'delivered'` → Rejected by create gate.
6. **Cross-Tenant Order Read (`get`/`list`)**: Customer A queries `orders` without `where('customerId', '==', uid)` or fetches Customer B's order ID → Rejected by `existing().customerId == request.auth.uid`.
7. **Unverified Admin Email Spoof**: User with `email_verified: false` matching an owner email attempts product write → Rejected by `isVerified()`.
8. **Post-Delivery Order Stage Tampering**: Attempt to regress `stage` from `'delivered'` to `'confirmed'` → Rejected by `existing().stage != 'delivered'`.
9. **Oversized Document ID Poisoning**: Document ID longer than 128 chars or containing slashes/spaces → Rejected by `isValidId()`.
10. **PII Blanket Read on `/users`**: Signed-in Customer A lists `/users` → Rejected by `resource.data.uid == request.auth.uid`.
11. **Profile Wishlist Type Poisoning**: Customer writes `wishlist: [12345]` → Rejected by `wishlist[0] is string`.
12. **Fractional/Out-of-Bounds Review Rating**: Customer creates review with `rating: 99` or `rating: 4.5` → Rejected by `data.rating is int && data.rating >= 1 && data.rating <= 5`.
