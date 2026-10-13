import React from 'react';
import { X, ShieldCheck, Scale, FileText, Smartphone } from 'lucide-react';

interface Props {
  docType: 'TERMS' | 'PRIVACY' | 'GAMING_LAWS' | 'PLAY_POLICY' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<Props> = ({ docType, onClose }) => {
  if (!docType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {docType === 'TERMS' && <FileText className="w-5 h-5 text-amber-400" />}
            {docType === 'PRIVACY' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            {docType === 'GAMING_LAWS' && <Scale className="w-5 h-5 text-amber-400" />}
            {docType === 'PLAY_POLICY' && <Smartphone className="w-5 h-5 text-blue-400" />}
            <div>
              <h3 className="text-base font-bold text-white">
                {docType === 'TERMS' && 'Terms of Service'}
                {docType === 'PRIVACY' && 'Privacy Policy & Data Security'}
                {docType === 'GAMING_LAWS' && 'Indian Skill-Gaming & Tax Disclosure'}
                {docType === 'PLAY_POLICY' && 'Google Play Compliance Checklist'}
              </h3>
              <span className="text-[10px] text-slate-400">Effective as of October 2026</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {docType === 'TERMS' && (
            <>
              <h4 className="font-bold text-white text-sm">1. Acceptance of Terms</h4>
              <p>
                By creating an account or accessing GameEarn Pro, you confirm that you are at least 18 years of age and a legal resident of India. This application offers promotional casual games designed for entertainment, mental agility, and reward points.
              </p>

              <h4 className="font-bold text-white text-sm">2. Free-to-Play Structure & No Gambling</h4>
              <p>
                GameEarn Pro does not charge any entry fees, deposits, or wagers to participate in casual games. Games do not constitute gambling or betting under the Public Gambling Act, 1867. All points represent promotional loyalty rewards redeemable subject to minimum thresholds.
              </p>

              <h4 className="font-bold text-white text-sm">3. Fair Play & Anti-Cheat Policies</h4>
              <p>
                Any use of automated scripts, device emulators, speed-hack tools, multiple duplicate accounts, or fraudulent referral schemes will result in immediate account suspension and forfeiture of all accumulated points.
              </p>

              <h4 className="font-bold text-white text-sm">4. Redemption Rules</h4>
              <p>
                Redemptions are processed via approved Indian payment channels (UPI or IMPS Bank Transfer). Users must supply accurate payment details. In evaluation sandbox mode, transactions are simulated without financial movement until full partner provisioning.
              </p>
            </>
          )}

          {docType === 'PRIVACY' && (
            <>
              <h4 className="font-bold text-white text-sm">1. Compliance with Indian Privacy Laws</h4>
              <p>
                GameEarn Pro adheres to the Information Technology Act, 2000, the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act (DPDPA 2023).
              </p>

              <h4 className="font-bold text-white text-sm">2. Information Collected</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Authentication details: Mobile number or email address.</li>
                <li>Redemption details: Indian UPI ID (VPA) or Bank Account & IFSC code solely for processing user-initiated payouts.</li>
                <li>Device integrity signals: Anonymous device identifier to enforce rate-limits and prevent multiple account fraud.</li>
              </ul>

              <h4 className="font-bold text-white text-sm">3. Zero Storage of Banking Secrets</h4>
              <p>
                We NEVER request, access, or store banking passwords, UPI MPINs, debit card numbers, or CVV codes. All payments are dispatched via verified, licensed payment aggregation rails.
              </p>

              <h4 className="font-bold text-white text-sm">4. Right to Deletion</h4>
              <p>
                Users may request complete account and data erasure anytime directly from Account Settings. All personal identifiers are permanently excised within 30 days.
              </p>
            </>
          )}

          {docType === 'GAMING_LAWS' && (
            <>
              <h4 className="font-bold text-white text-sm">1. Skill-Based Gaming Legal Basis</h4>
              <p>
                Under established Indian Supreme Court jurisprudence (State of Bombay v. R.M.D. Chamarbaugwala; State of A.P. v. K. Satyanarayana; K.R. Lakshmanan v. State of Tamil Nadu), competitions involving substantial skill, knowledge, attention, and dexterity are protected commercial activities under Article 19(1)(g) of the Constitution of India and are distinct from gambling.
              </p>

              <h4 className="font-bold text-white text-sm">2. State Territory Exclusions</h4>
              <p>
                Due to localized state legislation, real-reward gaming or prize distributions are restricted for residents of Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, and Sikkim. Users from these territories are welcome to enjoy games in free recreational mode without payout eligibility.
              </p>

              <h4 className="font-bold text-white text-sm">3. Indian Income Tax & TDS (Sec 194BA)</h4>
              <p>
                As mandated by the Finance Act 2023 and Section 194BA of the Income Tax Act 1961, when real-money gaming operations are activated, Tax Deducted at Source (TDS) at the rate of 30% applies to net winnings upon withdrawal. Permanent Account Number (PAN) KYC verification is mandatory prior to processing high-value disbursements.
              </p>
            </>
          )}

          {docType === 'PLAY_POLICY' && (
            <>
              <h4 className="font-bold text-white text-sm">Google Play Real-Money Gaming & Loyalty App Policies</h4>
              <p>
                To publish GameEarn Pro on the Google Play Store, the following compliance standards must be strictly satisfied:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-white">Free-to-Play Classification:</strong> The app does not accept real currency deposits or bets, categorizing it as a loyalty & casual rewards application rather than a gambling operator.</li>
                <li><strong className="text-white">Target Audience & Content Rating:</strong> Rated 18+ on Google Play Console due to financial redemption features.</li>
                <li><strong className="text-white">Data Safety Declaration:</strong> Complete declaration of phone number, financial details (UPI VPA for payouts), and device identifiers in the Google Play Data Safety questionnaire.</li>
                <li><strong className="text-white">No Misleading Claims:</strong> Clear messaging that rewards are promotional incentives, avoiding "get rich quick" or guaranteed income claims.</li>
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs hover:bg-amber-400"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
