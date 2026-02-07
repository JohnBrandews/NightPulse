import { differenceInYears } from 'date-fns';

export const MINIMUM_AGE_FEMALE = 20;

export function calculateAge(dateOfBirth: Date): number {
  return differenceInYears(new Date(), new Date(dateOfBirth));
}

export function isAgeValidForFemale(dateOfBirth: Date): boolean {
  const age = calculateAge(dateOfBirth);
  return age >= MINIMUM_AGE_FEMALE;
}

export function validateDateOfBirth(dateOfBirth: Date): { valid: boolean; error?: string } {
  const age = calculateAge(dateOfBirth);
  
  if (age < 18) {
    return { valid: false, error: 'You must be at least 18 years old' };
  }
  
  if (age > 100) {
    return { valid: false, error: 'Invalid date of birth' };
  }
  
  return { valid: true };
}
