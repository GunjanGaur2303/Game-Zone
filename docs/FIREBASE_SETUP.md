# Firebase Setup & Database Schema Blueprint — GameEarn Pro

This document outlines the Firestore collection schemas, security rules, and Firebase Authentication setup for deploying GameEarn Pro to production.

---

## 1. Firebase Authentication Setup

1. In the **Firebase Console**, navigate to **Build > Authentication**.
2. Enable **Phone Auth** (under Sign-in method) for Indian OTP logins (`+91`).
3. Enable **Email/Password** or **Email Link (Passwordless)**.
4. Add authorized domains:
   - `localhost`
   - Your production Cloud Run / custom domain (e.g., `gameearn.pro`).

---

## 2. Cloud Firestore Database Schema

### Collection: `users/{userId}`
```json
{
  "id": "usr_78291",
  "name": "Gunjan Gaur",
  "phone": "+919876543210",
  "email": "gunjan@example.com",
  "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=GameChampion",
  "tier": "Gold",
  "referralCode": "GUNJAN77",
  "referredBy": null,
  "referralCount": 4,
  "referralEarnings": 1000,
  "availablePoints": 3450,
  "pendingPoints": 0,
  "redeemedPoints": 1500,
  "streakDays": 3,
  "lastCheckInDate": "2026-10-12",
  "role": "user",
  "isBanned": false,
  "createdAt": "2026-09-15T10:00:00.000Z"
}
```

### Collection: `transactions/{transactionId}`
```json
{
  "id": "TXN_20261012_8912",
  "userId": "usr_78291",
  "type": "GAME_WIN",
  "title": "Quiz Trivia Arena Score",
  "points": 120,
  "cashEquivalent": 1.20,
  "status": "COMPLETED",
  "timestamp": "2026-10-12T08:15:00.000Z",
  "hash": "a1b2c3d4e5f67890"
}
```

### Collection: `withdrawals/{withdrawalId}`
```json
{
  "id": "WDR_20261012_4412",
  "userId": "usr_78291",
  "userName": "Gunjan Gaur",
  "method": "UPI",
  "pointsDeducted": 5000,
  "amountINR": 50.0,
  "details": {
    "upiId": "gunjan@okhdfcbank"
  },
  "status": "PENDING",
  "createdAt": "2026-10-12T08:16:00.000Z",
  "payoutTxnReference": null
}
```

---

## 3. Production `firestore.rules` Security Configuration

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // User profiles: users can read and update display info, but CANNOT tamper with availablePoints
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow update: if isOwner(userId) 
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['availablePoints', 'pendingPoints', 'role', 'isBanned']);
      allow write: if isAdmin();
    }

    // Transactions: append-only ledger via Cloud Functions / Admin SDK only
    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow write: if false; // Only Cloud Functions server can create transactions
    }

    // Withdrawals: Users can create pending requests within balance, only admins can approve/update
    match /withdrawals/{withdrawalId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // Public configurations
    match /config/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```
