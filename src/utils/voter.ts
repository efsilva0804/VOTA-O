/**
 * Generates and persists a unique client token to enforce 1 vote per person.
 */
const VOTER_TOKEN_KEY = 'fotovoto_voter_token';
const VOTER_NAME_KEY = 'fotovoto_voter_name';

export function getOrCreateVoterToken(): string {
  if (typeof window === 'undefined') return 'server-token';
  
  let token = localStorage.getItem(VOTER_TOKEN_KEY);
  if (!token) {
    token = 'voter_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(VOTER_TOKEN_KEY, token);
  }
  return token;
}

export function getSavedVoterName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(VOTER_NAME_KEY) || '';
}

export function saveVoterName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOTER_NAME_KEY, name.trim());
}
