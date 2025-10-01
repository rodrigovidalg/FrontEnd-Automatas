export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePasswordStrength = (password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
} => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const strengthMap = {
    0: 'weak',
    1: 'weak', 
    2: 'fair',
    3: 'fair',
    4: 'good',
    5: 'strong'
  } as const;

  return {
    strength: strengthMap[score as keyof typeof strengthMap],
    score
  };
};