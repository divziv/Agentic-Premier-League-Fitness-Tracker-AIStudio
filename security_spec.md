# Security Specification for Aura Fitness

## Data Invariants
1. A user can only modify their own profile.
2. A squad member can only increment squad progress if they have a corresponding new workout session.
3. Squad IDs must be valid alphanumeric strings.
4. XP boosts are strictly calculated based on session completion.

## The Dirty Dozen (Test Matrix)
1. **Unauthorized Profile Edit**: User B tries to change User A's `displayName`. (DENIED)
2. **Shadow Field Injection**: User A tries to add `isAdmin: true` to their user document. (DENIED)
3. **Identity Spoofing**: User A tries to create a session for User B. (DENIED)
4. **XP Inflation**: User A tries to add 1,000,000 XP in a single update. (DENIED)
5. **Orphaned Session**: Creating a session in a squad the user doesn't belong to. (DENIED)
6. **Non-Verified Email**: Writing to a profile with `email_verified: false` (if enabled). (DENIED)
7. **Junk ID Poisoning**: Using a 2KB string as a squad ID. (DENIED)
8. **Negative Distance**: Logging a session with distance `-10`. (DENIED)
9. **Past Date Manipulation**: Setting `timestamp` to 2010. (DENIED)
10. **Squad Leak**: User C (non-member) tries to list all squad sessions. (DENIED)
11. **Avatar Hijack**: Setting `avatarId` to a non-existent or malicious string. (DENIED)
12. **Streak Counter Reset**: An attacker tries to reset another user's streak. (DENIED)
