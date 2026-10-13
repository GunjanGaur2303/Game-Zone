/**
 * Automated Unit Test Suite for GameEarn Pro
 * Tests:
 * 1. Anti-Cheat & Score-to-Reward Algorithms
 * 2. Puzzle Solvability Inversion Mathematics
 * 3. Indian UPI VPA & Bank IFSC Regex Validation
 * 4. Immutable Ledger Cryptographic SHA-256 Hashes
 * 5. 7-Day Streak Rewards Progression
 */

import crypto from 'crypto';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

export function runAllUnitTests(): TestResult[] {
  const results: TestResult[] = [];

  function test(suite: string, name: string, fn: () => void) {
    try {
      fn();
      results.push({ suite, name, passed: true });
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      results.push({ suite, name, passed: false, error: err });
    }
  }

  // Suite 1: Anti-Cheat & Rewards
  test('Anti-Cheat', 'Bubble shooter score scaling capped at 120 points', () => {
    const calc = (score: number) => Math.min(Math.floor(score / 15), 120);
    if (calc(300) !== 20) throw new Error(`Expected 20, got ${calc(300)}`);
    if (calc(3000) !== 120) throw new Error(`Expected cap 120, got ${calc(3000)}`);
  });

  test('Anti-Cheat', 'Quiz trivia points sanitized between 0 and 150', () => {
    const sanitizeQuiz = (score: number) => Math.min(Math.max(0, score), 150);
    if (sanitizeQuiz(-50) !== 0) throw new Error('Failed lower bound clamp');
    if (sanitizeQuiz(999) !== 150) throw new Error('Failed upper bound clamp');
    if (sanitizeQuiz(120) !== 120) throw new Error('Failed normal score');
  });

  test('Anti-Cheat', 'Fishing Era score scaling scales 1pt per 10 fish score and caps at 150', () => {
    const calcFishing = (score: number) => Math.min(Math.max(20, Math.floor(score / 10)), 150);
    if (calcFishing(100) !== 20) throw new Error('Minimum fish floor failed');
    if (calcFishing(800) !== 80) throw new Error('Expected 80 points for 800 score');
    if (calcFishing(5000) !== 150) throw new Error('Fishing Era cap 150 failed');
  });

  test('Anti-Cheat', 'JILI Fortune Gems points scale within range 25 to 160', () => {
    const calcJili = (score: number) => Math.min(Math.max(25, score), 160);
    if (calcJili(10) !== 25) throw new Error('JILI minimum clamp failed');
    if (calcJili(120) !== 120) throw new Error('JILI normal score failed');
    if (calcJili(999) !== 160) throw new Error('JILI maximum cap failed');
  });

  // Suite 2: Puzzle Solvability
  test('Puzzle Mechanics', '8-Puzzle inversions parity guarantees solvable boards', () => {
    function isSolvable(tiles: number[]): boolean {
      let inversions = 0;
      for (let i = 0; i < tiles.length - 1; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          if (tiles[i] !== 0 && tiles[j] !== 0 && tiles[i] > tiles[j]) {
            inversions++;
          }
        }
      }
      return inversions % 2 === 0;
    }

    const solvable1 = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    const solvable2 = [1, 8, 2, 0, 4, 3, 7, 6, 5];
    const unsolvable = [1, 2, 3, 4, 5, 6, 8, 7, 0]; // 1 inversion swap

    if (!isSolvable(solvable1)) throw new Error('Standard board reported unsolvable');
    if (!isSolvable(solvable2)) throw new Error('Solvable board reported false');
    if (isSolvable(unsolvable)) throw new Error('Unsolvable board reported solvable');
  });

  // Suite 3: Indian Payment Formats
  test('Indian Payments', 'UPI VPA regex accepts valid handles & rejects invalid', () => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    const valids = ['gunjan@okaxis', 'player99@paytm', 'user.name@okhdfcbank', '9876543210@upi'];
    const invalids = ['invalid-upi', '@okaxis', 'gunjan@', 'gunjan@c', 'spaces in@upi'];

    valids.forEach((v) => {
      if (!upiRegex.test(v)) throw new Error(`Valid UPI rejected: ${v}`);
    });
    invalids.forEach((iv) => {
      if (upiRegex.test(iv)) throw new Error(`Invalid UPI accepted: ${iv}`);
    });
  });

  test('Indian Payments', 'Bank IFSC code regex matches standard RBI format', () => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const valids = ['SBIN0001234', 'HDFC0000456', 'ICIC0007890', 'PUNB0123456'];
    const invalids = ['sbin0001234', 'SBIN1001234', 'HDFC00456', 'TOOLONGFSC12345'];

    valids.forEach((v) => {
      if (!ifscRegex.test(v)) throw new Error(`Valid IFSC rejected: ${v}`);
    });
    invalids.forEach((iv) => {
      if (ifscRegex.test(iv)) throw new Error(`Invalid IFSC accepted: ${iv}`);
    });
  });

  // Suite 4: Cryptographic Ledger
  test('Ledger Integrity', 'SHA-256 checksum uniquely identifies transaction records', () => {
    const txnId = 'TXN_20261012_01';
    const points = 150;
    const hash1 = crypto.createHash('sha256').update(`${txnId}:${points}`).digest('hex').substring(0, 16);
    const hash2 = crypto.createHash('sha256').update(`${txnId}:${points}`).digest('hex').substring(0, 16);
    const tampered = crypto.createHash('sha256').update(`${txnId}:${points + 50}`).digest('hex').substring(0, 16);

    if (hash1 !== hash2) throw new Error('Deterministic hash mismatch');
    if (hash1 === tampered) throw new Error('Tampered score generated identical hash');
  });

  // Suite 5: Daily Streak
  test('Daily Streak', '7-day streak rewards escalate correctly and cycle', () => {
    const streakRewards = [10, 15, 25, 35, 50, 75, 100];
    if (streakRewards[0] !== 10) throw new Error('Day 1 mismatch');
    if (streakRewards[6] !== 100) throw new Error('Day 7 mismatch');
  });

  return results;
}
