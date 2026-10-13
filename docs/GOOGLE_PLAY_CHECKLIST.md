# Google Play Console Publishing Checklist for GameEarn Pro

Publishing reward and skill-based casual gaming apps in India requires rigorous adherence to Google Play policies. Follow this checklist prior to submitting for review.

---

## 1. Google Play Policy Classification

- [x] **Free-to-Play Structure**: Confirm that the application has zero paid entry fees, deposit gates, or real-money wagering. (Apps with paid entry fees fall under Google Play's strict Pilot Program for Real-Money Gaming).
- [x] **Loyalty & Promotional Rewards**: Explicitly classify the application under *Arcade / Casual / Lifestyle Rewards*.
- [x] **No Guaranteed Income Claims**: Ensure metadata (title, short description, screenshots, promo video) does not promise guaranteed wages, salaries, or "get rich quick" income.
- [x] **Skill vs. Chance**: Clearly articulate that casual games (Trivia, sliding puzzle, memory match, math sprint) test knowledge, motor dexterity, and logic.

---

## 2. Target Audience & Content Rating Questionnaire

- [x] **Target Age**: Set target audience to **18 and older**.
- [x] **IARC Rating Questionnaire**:
  - Does the app contain violence? **No**
  - Does the app contain crude humor / sexual content? **No**
  - Does the app facilitate simulated gambling? **No** (promotional points only, not casino style slots/roulette for cash)
  - Does the app allow financial withdrawals/redemptions? **Yes**
- [x] **India Rating Result**: Typically receives PEGI 12 / USK 12 / India 18+ depending on redemption declarations.

---

## 3. Data Safety Form Requirements

Declare the following in the Google Play Data Safety section:

| Data Type | Collected? | Shared? | Purpose | Encrypted in Transit? | Erasure Requestable? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phone Number / Email** | Yes | No | Account authentication & security | Yes (TLS 1.3) | Yes (In-app Account Deletion) |
| **Financial Info (UPI ID / Bank IFSC)** | Yes | Yes (Payment Processor) | Payout fulfillment | Yes | Yes |
| **Device or other IDs** | Yes | No | Anti-fraud & rate-limiting | Yes | Yes |
| **User Interactions / Gameplay** | Yes | No | Score validation & leaderboard | Yes | Yes |

---

## 4. Store Listing Assets

- [x] **App Icon**: 512 x 512 px 32-bit PNG with alpha.
- [x] **Feature Graphic**: 1024 x 500 px JPG or 24-bit PNG.
- [x] **Phone Screenshots**: Minimum 4 high-resolution screenshots (1080 x 2400 px or 16:9 ratio) highlighting:
  1. Rewards Dashboard & Streak Check-in
  2. Casual Arcade Games Catalog
  3. Skill games in action (Quiz Trivia, Bubble Shooter, Memory Match)
  4. Instant UPI / Bank Redemption Ledger
- [x] **Privacy Policy URL**: Live, public HTTPS link complying with Indian IT Act 2000 and DPDPA 2023.

---

## 5. Reviewer Access & Sandbox Demonstration

Google Play reviewers test app functionality before approving. Provide the following test credentials in the **App Access** review section:
- **Test Phone Number**: `+91 98765 43210`
- **Sandbox OTP**: `123456`
- **Reviewer Note**:
  > *"GameEarn Pro is a free-to-play promotional casual gaming app. No entry fees or real money deposits are accepted. Reward disbursements are in sandbox evaluation mode. Test phone +91 98765 43210 has pre-seeded points for end-to-end redemption verification."*
