'use client';
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import logo from '../../assets/images/yappLogo.png';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Password strength enum and validation (non-Clerk)
enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const rules: ((pw: string) => boolean)[] = [
    (pw) => pw.length >= 8,
    (pw) => /[a-z]/.test(pw),
    (pw) => /[A-Z]/.test(pw),
    (pw) => /[0-9]/.test(pw),
    (pw) => /[^a-zA-Z0-9]/.test(pw),
    (pw) => pw.length >= 12,
  ];
  rules.forEach((rule) => rule(password) && score++);
  if (score <= 2) return PasswordStrength.WEAK;
  if (score <= 3) return PasswordStrength.FAIR;
  if (score <= 4) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
};

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const rules: { test: (pw: string) => boolean; message: string }[] = [
    { test: (pw) => pw.length >= 8, message: 'At least 8 characters long' },
    { test: (pw) => /[a-z]/.test(pw), message: 'One lowercase letter' },
    { test: (pw) => /[A-Z]/.test(pw), message: 'One uppercase letter' },
    { test: (pw) => /[0-9]/.test(pw), message: 'One number' },
    { test: (pw) => /[^a-zA-Z0-9]/.test(pw), message: 'One special character' },
  ];
  rules.forEach((rule) => {
    if (!rule.test(password)) errors.push(rule.message);
  });
  return { isValid: errors.length === 0, errors };
};

const validateUsername = (username: string): boolean => {
  // Example: at least 3 chars, alphanumeric and underscores
  return /^[a-zA-Z0-9_]{3,}$/.test(username.trim());
};

const validateDisplayName = (name: string): boolean => {
  // At least 2 chars, letters, numbers, spaces, underscores, hyphens
  return /^[\w\s-]{2,}$/.test(name.trim());
};

export default function SignUp() {
  const router = useRouter();

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [announceError, setAnnounceError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const getInputBorder = (value: string, isFocused: boolean, hasError: boolean = false) => {
    if (hasError) return 'border-red-500';
    if (value || isFocused) return 'border-[#0077d4]';
    return 'border-[#dcd9d3]';
  };

  const validateField = useCallback(
    (field: string, value: string) => {
      const errors = { ...fieldErrors };
      const rules: Record<string, (val: string) => string | null> = {
        email: (val) => (val && !validateEmail(val) ? 'Please enter a valid email address' : null),
        username: (val) => (!val.trim() ? 'Username is required' : !validateUsername(val) ? 'Username must be at least 3 characters and contain only letters, numbers, or underscores' : null),
        displayName: (val) => (!val.trim() ? 'Display name is required' : !validateDisplayName(val) ? 'Display name must be at least 2 characters and can contain letters, numbers, spaces, underscores, or hyphens' : null),
        password: (val) => {
          const res = validatePassword(val);
          return val && !res.isValid ? 'Password requirements not met' : null;
        },
        confirmPassword: (val) => (val && val !== password ? 'Passwords do not match' : null),
      };
      const error = rules[field]?.(value) || null;
      if (error) errors[field] = error;
      else delete errors[field];
      setFieldErrors(errors);
    },
    [fieldErrors, password]
  );

  const handleInputChange = (field: string, value: string) => {
    const setters: Record<string, (val: string) => void> = {
      email: setEmail,
      username: setUsername,
      displayName: setDisplayName,
      password: (val) => {
        setPassword(val);
        if (confirmPassword) validateField('confirmPassword', confirmPassword);
      },
      confirmPassword: setConfirmPassword,
    };
    setters[field]?.(value);
    validateField(field, value);
    if (formError) setFormError('');
  };

  const passwordStrength = password ? checkPasswordStrength(password) : null;
  const passwordValidation = password ? validatePassword(password) : { isValid: false, errors: [] };

  const isFormValid =
    email.trim() &&
    username.trim() &&
    validateUsername(username) &&
    displayName.trim() &&
    validateDisplayName(displayName) &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    agreeToTerms &&
    validateEmail(email) &&
    passwordValidation.isValid &&
    Object.keys(fieldErrors).length === 0;

  const signUpWithCredentials = async (email: string, password: string, username: string, displayName: string) => {
    setIsLoading(true);
    try {
      const { authSignup } = await import('@/lib/api');
      await authSignup({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        display_name: displayName.trim(),
      });
      router.push('/signin');
    } catch (error: any) {
      let msg = 'Registration failed. Please try again.';
      if (error?.message) msg = error.message;
      else if (typeof error === 'string') msg = error;
      setFormError(msg);
      setAnnounceError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const errors: Record<string, string> = {};
    const rules: { [key: string]: () => string | null } = {
      email: () => (!email.trim() ? 'Email is required' : !validateEmail(email) ? 'Please enter a valid email address' : null),
      username: () => (!username.trim() ? 'Username is required' : !validateUsername(username) ? 'Username must be at least 3 characters and contain only letters, numbers, or underscores' : null),
      displayName: () => (!displayName.trim() ? 'Display name is required' : !validateDisplayName(displayName) ? 'Display name must be at least 2 characters and can contain letters, numbers, spaces, underscores, or hyphens' : null),
      password: () => {
        if (!password) return 'Password is required';
        const res = validatePassword(password);
        return !res.isValid ? 'Password requirements not met' : null;
      },
      confirmPassword: () => (!confirmPassword ? 'Please confirm your password' : confirmPassword !== password ? 'Passwords do not match' : null),
      terms: () => (!agreeToTerms ? 'You must agree to all Terms, Privacy Policy and Fees' : null),
    };

    Object.entries(rules).forEach(([field, check]) => {
      const error = check();
      if (error) errors[field] = error as string;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const errorMessage = 'Please fix the form errors before submitting';
      setFormError(errorMessage);
      setAnnounceError(errorMessage);
      return;
    }

    setFormError('');
    setFieldErrors({});
    await signUpWithCredentials(email, password, username, displayName);
  };

  const getPasswordStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 'bg-red-500';
      case PasswordStrength.FAIR:
        return 'bg-yellow-500';
      case PasswordStrength.GOOD:
        return 'bg-blue-500';
      case PasswordStrength.STRONG:
        return 'bg-green-500';
    }
  };

  const getPasswordStrengthWidth = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 'w-1/4';
      case PasswordStrength.FAIR:
        return 'w-2/4';
      case PasswordStrength.GOOD:
        return 'w-3/4';
      case PasswordStrength.STRONG:
        return 'w-full';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-center bg-[#F3F3F3] [--color:#E1E1E1] \
    bg-[linear-gradient(0deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent)] bg-[length:55px_55px]">
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announceError}
      </div>

      <main className="flex-1 flex justify-center items-center m-8 rounded-[20px]">
        <motion.div
          className="flex flex-col justify-center bg-white w-[545px] rounded-3xl p-8 z-10 border-3 border-[#dcd9d3]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="flex justify-start items-start">
            <Link href="/get-started" className="flex flex-row justify-start items-start relative -inset-2" aria-label="Go back to get started page">
              <Image className="w-7" src={logo} alt="Yapp Logo" priority />
            </Link>
          </div>

          <section className="flex flex-col justify-center m-8 mt-2 mb-2">
            <p className="text-xl font-medium font-MyFont mt-4 text-[#1e1e1e] w-full">Yapp — Connect. Collaborate. Communicate.</p>
            <p className="text-xl font-base text-[#B6B09F] mb-8 tracking-wide">Register into Yapp account</p>

            <form onSubmit={handleSubmit} className="flex flex-col justify-center flex-1 text-[#1e1e1e] font-MyFont" noValidate>
              {/* email field */}
              <div className="flex flex-col gap-1 mb-8">
                <label htmlFor="email" className="text-sm text-[#73726e] font-medium">
                  Email {!email && <span className="text-red-600" aria-label="required">*</span>}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`rounded-lg px-2 py-3 pl-3 w-full bg-white text-black font-light border-3 font-MyFont ${getInputBorder(email, focusedField === 'email', !!fieldErrors.email)} focus:outline-none focus:border-[#0077d4] transition-colors`}
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  aria-invalid={!!fieldErrors.email}
                  disabled={isLoading}
                  required
                />
                {fieldErrors.email && (
                  <span id="email-error" className="text-red-600 text-sm mt-1" role="alert">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              {/* username field */}
              <div className="flex flex-col gap-1 mb-8">
                <label htmlFor="username" className="text-sm text-[#73726e] font-medium">
                  Username {!username && <span className="text-red-600" aria-label="required">*</span>}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className={`rounded-lg px-2 py-3 pl-3 w-full bg-white text-black font-light border-3 font-MyFont ${getInputBorder(username, focusedField === 'username', !!fieldErrors.username)} focus:outline-none focus:border-[#0077d4] transition-colors`}
                  value={username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField('')}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                  aria-invalid={!!fieldErrors.username}
                  disabled={isLoading}
                  required
                />
                {fieldErrors.username && (
                  <span id="username-error" className="text-red-600 text-sm mt-1" role="alert">
                    {fieldErrors.username}
                  </span>
                )}
              </div>

              {/* display name field */}
              <div className="flex flex-col gap-1 mb-8">
                <label htmlFor="displayName" className="text-sm text-[#73726e] font-medium">
                  Display Name {!displayName && <span className="text-red-600" aria-label="required">*</span>}
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  className={`rounded-lg px-2 py-3 pl-3 w-full bg-white text-black font-light border-3 font-MyFont ${getInputBorder(displayName, focusedField === 'displayName', !!fieldErrors.displayName)} focus:outline-none focus:border-[#0077d4] transition-colors`}
                  value={displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  onFocus={() => setFocusedField('displayName')}
                  onBlur={() => setFocusedField('')}
                  aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
                  aria-invalid={!!fieldErrors.displayName}
                  disabled={isLoading}
                  required
                />
                {fieldErrors.displayName && (
                  <span id="displayName-error" className="text-red-600 text-sm mt-1" role="alert">
                    {fieldErrors.displayName}
                  </span>
                )}
              </div>

              {/* password field */}
              <div className="flex flex-col gap-1 mb-8">
                <label htmlFor="password" className="text-sm text-[#73726e] font-medium">
                  Password {!password && <span className="text-red-600" aria-label="required">*</span>}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`rounded-lg px-2 py-3 pl-3 w-full pr-12 bg-white text-black font-light border-3 font-MyFont ${getInputBorder(password, focusedField === 'password', !!fieldErrors.password)} focus:outline-none focus:border-[#0077d4] transition-colors`}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    aria-describedby="password-requirements"
                    aria-invalid={!!fieldErrors.password}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 cursor-pointer hover:text-[#0077d4] transition-colors disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEye size={24} /> : <FaEyeSlash size={24} />}
                  </button>
                </div>

                {/* password strength indicator */}
                {password && passwordStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)} ${getPasswordStrengthWidth(passwordStrength)}`} />
                      </div>
                      <span className="text-xs font-medium capitalize text-gray-600">{passwordStrength}</span>
                    </div>
                  </div>
                )}

                {/* password requirements */}
                <div id="password-requirements" className="mt-2 space-y-1">
                  {password && passwordValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <FaTimes className="text-red-500" size={10} />
                      <span className="text-red-600">{error}</span>
                    </div>
                  ))}
                  {password && passwordValidation.isValid && (
                    <div className="flex items-center gap-1 text-xs">
                      <FaCheck className="text-green-500" size={10} />
                      <span className="text-green-600">Password meets all requirements</span>
                    </div>
                  )}
                  {!password && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Password must contain:</div>
                      <div className="ml-2 space-y-0.5">
                        <div>• At least 8 characters long</div>
                        <div>• One lowercase letter</div>
                        <div>• One uppercase letter</div>
                        <div>• One number</div>
                        <div>• One special character</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-1 mb-4">
                <label htmlFor="confirmPassword" className="text-sm text-[#73726e] font-medium">
                  Re-type Password {!confirmPassword && <span className="text-red-600" aria-label="required">*</span>}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`rounded-lg px-2 py-3 pl-3 w-full pr-12 bg-white text-black font-light border-3 font-MyFont ${getInputBorder(confirmPassword, focusedField === 'confirm', !!fieldErrors.confirmPassword)} focus:outline-none focus:border-[#0077d4] transition-colors`}
                    value={confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField('')}
                    aria-invalid={!!fieldErrors.confirmPassword}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 cursor-pointer hover:text-[#0077d4] transition-colors disabled:cursor-not-allowed"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <FaEye size={24} /> : <FaEyeSlash size={24} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <span id="confirmPassword-error" className="text-red-600 text-sm mt-1" role="alert">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
                {confirmPassword && !fieldErrors.confirmPassword && confirmPassword === password && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    <FaCheck className="text-green-500" size={10} />
                    <span className="text-green-600">Passwords match</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 accent-[#0077d4] focuc:outline-none"
                  aria-describedby={fieldErrors.terms ? 'terms-error' : undefined}
                  aria-invalid={!!fieldErrors.terms}
                  disabled={isLoading}
                  required
                />
                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I agree to all{' '}
                  <Link href="/terms" className="text-[#0077d4] hover:underline" target="_blank">
                    Terms
                  </Link>
                  ,{' '}
                  <Link href="/privacy" className="text-[#0077d4] hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/fees" className="text-[#0077d4] hover:underline" target="_blank">
                    Fees
                  </Link>
                </label>
              </div>
              {fieldErrors.terms && (
                <span id="terms-error" className="text-red-600 text-sm mb-4 block" role="alert">
                  {fieldErrors.terms}
                </span>
              )}

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm" role="alert" aria-live="polite">
                    {formError}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="bg-[#2383E2] text-white py-3 rounded-lg text-lg w-full cursor-pointer hover:bg-[#0077d4] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#0077d4] focus:ring-offset-2"
                  aria-describedby="signup-button-description"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" size={16} />
                      Creating Account...
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </button>
                <div id="signup-button-description" className="sr-only">
                  {!isFormValid && 'Please fill out all required fields correctly to create account'}
                </div>
              </div>

              <p className="text-sm mt-2 text-[#1e1e1e] flex justify-center items-center gap-2">
                Already have an account?
                <Link href="/signin" className="text-[#1371FF] hover:underline focus:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </section>
        </motion.div>
      </main>
    </div>
  );
}