export function validateUserInput({ name, email, password, address }) {
  const errors = {};

  // Name: Min 20 characters, Max 60 characters
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required.';
  } else if (name.trim().length < 20 || name.trim().length > 60) {
    errors.name = 'Name must be between 20 and 60 characters.';
  }

  // Email: Standard email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') {
    errors.email = 'Email is required.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Email must follow standard validation rules (e.g., user@example.com).';
  }

  // Address: Max 400 characters
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    errors.address = 'Address is required.';
  } else if (address.length > 400) {
    errors.address = 'Address must not exceed 400 characters.';
  }

  // Password: 8-16 characters, must include at least one uppercase letter and one special character
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  } else {
    if (password.length < 8 || password.length > 16) {
      errors.password = 'Password must be between 8 and 16 characters.';
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      
      const pwdErrors = [];
      if (!hasUppercase) pwdErrors.push('at least one uppercase letter');
      if (!hasSpecial) pwdErrors.push('at least one special character');
      
      if (pwdErrors.length > 0) {
        errors.password = `Password must include ${pwdErrors.join(' and ')}.`;
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}
