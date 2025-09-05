'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import logo from '../../assets/images/yappLogo.png';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// type definitions for Clerk errors
interface ClerkError {
  code: string;
  message: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
}

interface ClerkAPIError {
  errors: ClerkError[];
  clerkTraceId?: string;
}

// type guard to check if error is a Clerk API error
const isClerkAPIError = (error: unknown): error is ClerkAPIError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as ClerkAPIError).errors) &&
    (error as ClerkAPIError).errors.length > 0
  );
};

// password strength enum
enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong'
}

// form validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

const validateUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username.trim());
};

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  const rules: ((pw: string) => boolean)[] = [
    pw => pw.length >= 8,
    pw => /[a-z]/.test(pw),
    pw => /[A-Z]/.test(pw),
    pw => /[0-9]/.test(pw),
    pw => /[^a-zA-Z0-9]/.test(pw),
    pw => pw.length >= 12
  ];

  rules.forEach(rule => {
    if(rule(password)) score++;
  })

  if (score <= 2) return PasswordStrength.WEAK;
  if (score <= 3) return PasswordStrength.FAIR;
  if (score <= 4) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
};

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const rules: {test: (pw: string) => boolean; message: string}[] = [
    {test: pw => pw.length >=8 , message: 'At least 8 characters long'},
    {test: pw => /[a-z]/.test(pw), message: 'One lowercase letter'},
    {test: pw => /[A-Z]/.test(pw), message: 'One uppercase letter'},
    {test: pw => /[0-9]/.test(pw), message: 'One number'},
    {test: pw => /[^a-zA-Z0-9]/.test(pw), message: 'One special character'}
  ];

  rules.forEach(rule => {
    if(!rule.test(password)){
      errors.push(rule.message)
    }
  });

  return { isValid: errors.length === 0, errors };
};

// Main component
export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/home'); // already signed-in users go straight to home
    }
  }, [isLoaded, isSignedIn, router]);

  // form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [announceError, setAnnounceError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = useCallback((error: unknown): string => {
    if (isClerkAPIError(error)) {
      const errorCode = error.errors[0]?.code;
      const errorMessage = error.errors[0]?.message;

      const errorMap: Record<string, string> = {
        form_identifier_exists: 'An account with this email already exists. Please sign in instead',
        form_password_pwned: 'This password has been found in a data breach. Please use a different password.',
        form_password_length_too_short: 'Password must be at least 8 characters long',
        form_password_no_uppercase_letter: 'Password must contain at least one uppercase letter',
        form_password_no_lowercase_letter: 'Password must contain at least one lowercase letter',
        form_password_no_number: 'Password must contain at least one number',
        form_password_no_special_char: 'Password must contain at least one special character',
        form_identifier_invalid: 'Please enter a valid email address',
        form_param_nil: 'Please fill in all required fields',
        too_many_requests: 'Too many attempts. Please try again later.',
        form_username_invalid: 'Username can only contain letters, numbers, and underscores',
        form_username_exists: 'This username is already taken. Please choose another.'
      };

      return errorMap[errorCode ?? ''] || errorMessage || 'Registration failed. Please try again.';
    }

    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred';
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred. Please try again.';
  }, []);

  //Ttemporarily removed the need for username in sign up flow

  const signUpWithCredentials = async (email: string, password: string) => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        // username: username.trim()
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/home');
      } else if (result.status === 'missing_requirements') {
        await result.prepareEmailAddressVerification({ strategy: 'email_code' });
        setShowVerification(true);
      } else {
        setFormError('Additional verification steps required');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setFormError(errorMessage);
      setAnnounceError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (code: string) => {
    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/home');
      } else {
        setFormError('Verification incomplete. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setFormError(errorMessage);
      setAnnounceError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // real-time validation
  const validateField = useCallback((field: string, value: string) => {
    const errors = { ...fieldErrors };

    const rules: Record<string, (val: string) => string | null> = {
      email: val => (val && !validateEmail(val) ? 'Please enter a valid email address' : null),
      username: val => (val && !validateUsername(val)? 'Username must be 3-20 characters, letters, number, and underscores only' : null),
      password: val => {
        const res = validatePassword(val);
        return val && !res.isValid ? 'Password requirements not met' : null
      },
      confirmPassword: val => (val && val !== password ? 'Passwords do not match': null)
    };

    const error = rules[field]?.(value) || null;
    if(error){
      errors[field] = error;
    } else {
      delete errors[field];
    }

    setFieldErrors(errors);
  }, [fieldErrors, password]);

  const handleInputChange = (field: string, value: string) => {

    const setters: Record<string, (val: string) => void> = {
      email: setEmail,
      username: setUsername,
      password: val => {
        setPassword(val);
        if(confirmPassword) validateField('confirmPassword', confirmPassword);
      },
      confirmPassword: setConfirmPassword,
    };

    setters[field]?.(value);
    validateField(field, value);
    if (formError) setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    // validate all fields
    const errors: Record<string, string> = {};

    const rules: { [key: string]: () => string | null } = {
      email: () =>
        !email.trim()
          ? 'Email is required'
          : !validateEmail(email)
          ? 'Please enter a valid email address'
          : null,
      
      username: () => 
        !username.trim()
          ? 'Username is required'
          : !validateUsername(username)
          ? 'Username must be 3-20 characters, letters, numbers, and underscores only'
          : null,

      password: () => {
        if(!password) return 'Password is required';
        const res = validatePassword(password);
        return !res.isValid ? 'Password requirements not met' : null;
      },

      confirmPassword: () => 
        !confirmPassword
          ? 'Please confirm your password'
          : confirmPassword !== password
          ? 'Passwords do not match'
          : null,

      terms: () => 
        !agreeToTerms
          ? 'You must agree to all Terms, Privacy Policy and Fees'
          : null,
    };

    Object.entries(rules).forEach(([field, check]) => {
      const error = check();
      if(error) errors[field] = error;
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
    await signUpWithCredentials(email, password);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setFormError('Please enter the verification code');
      return;
    }
    await verifyEmail(verificationCode);
  };

  const getInputBorder = (value: string, isFocused: boolean, hasError: boolean = false) => {
    if (hasError) return 'border-red-500';
    if (value || isFocused) return 'border-[#0077d4]';
    return 'border-[#dcd9d3]';
  };

  const passwordStrength = password ? checkPasswordStrength(password) : null;
  const passwordValidation = password ? validatePassword(password) : { isValid: false, errors: [] };

  const getPasswordStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK: return 'bg-red-500';
      case PasswordStrength.FAIR: return 'bg-yellow-500';
      case PasswordStrength.GOOD: return 'bg-blue-500';
      case PasswordStrength.STRONG: return 'bg-green-500';
    }
  };

  const getPasswordStrengthWidth = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK: return 'w-1/4';
      case PasswordStrength.FAIR: return 'w-2/4';
      case PasswordStrength.GOOD: return 'w-3/4';
      case PasswordStrength.STRONG: return 'w-full';
    }
  };

  const isFormValid = email.trim() && username.trim() && password &&
  confirmPassword && password === confirmPassword && agreeToTerms &&
  validateEmail(email) && validateUsername(username) &&
  passwordValidation.isValid && Object.keys(fieldErrors).length === 0;

  if (showVerification) {
    return (
      <div className="min-h-screen flex flex-col bg-center font-MyFont bg-transparent bg-[radial-gradient(#000000_1px,#e5e5f7_1px)] bg-[length:30px_30px]">
        <main className="flex-1 flex justify-center items-center m-8 rounded-[20px]">
          <motion.div
            className="flex flex-col justify-center bg-white w-[545px] rounded-3xl p-8 z-10 border-3"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="text-center mb-8">
              <p className="text-xl font-semibold font-MyFont text-[#1e1e1e] mb-4">
                Verify Your Email
              </p>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification code to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Please check your email and enter the code below
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-[#73726e] mb-2">
                  Verification Code
                </label>
                <input
                  id="verification-code"
                  type="text"
                  className="w-full px-4 py-3 border-3 border-[#dcd9d3] rounded-lg focus:border-[#0077d4] focus:outline-none text-center text-lg font-mono tracking-wider text-gray-900 placeholder-gray-400"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm" role="alert">
                    {formError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-[#2383E2] text-white py-3 rounded-lg font-medium hover:bg-[#0077d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" size={16} />
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-center bg-[#F3F3F3] [--color:#E1E1E1] 
    bg-[linear-gradient(0deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent)] bg-[length:55px_55px]">
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceError}
      </div>

      <main className="flex-1 flex justify-center items-center m-8 rounded-[20px]">
        <motion.div
          className="flex flex-col justify-center bg-white w-[545px] rounded-3xl p-8 z-10 border-3 border-[#dcd9d3]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className='flex justify-start items-start'>
            <Link
              href="/get-started"
              className="flex flex-row justify-start items-start relative -inset-2"
              aria-label="Go back to get started page"
            >
              <Image className='w-7' src={logo} alt='Yapp Logo' priority />
            </Link>
          </div>

          <section className="flex flex-col justify-center m-8 mt-2 mb-2">
            <p className="text-xl font-medium font-MyFont mt-4 text-[#1e1e1e] w-full">
              Yapp — Connect. Collaborate. Communicate.
            </p>
            <p className='text-xl font-base text-[#B6B09F] mb-8 tracking-wide'>
              Register into Yapp account
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-center flex-1 text-[#1e1e1e] font-MyFont"
              noValidate
            >
              {/* email field */}
              <div className="flex flex-col gap-1 mb-8">
                <label
                  htmlFor="email"
                  className="text-sm text-[#73726e] font-medium"
                >
                  Email {!email && <span className="text-red-600" aria-label="required">*</span>}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`rounded-lg px-2 py-3 pl-3 w-full bg-white text-black font-light border-3 font-MyFont 
                    ${getInputBorder(email, focusedField === 'email', !!fieldErrors.email)} focus:outline-none focus:border-[#0077d4] transition-colors`}
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
                <label
                  htmlFor="username"
                  className="text-sm text-[#73726e] font-medium"
                >
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
                  aria-describedby={fieldErrors.username ? 'username-error' : 'username-help'}
                  aria-invalid={!!fieldErrors.username}
                  disabled={isLoading}
                  required
                />
                {fieldErrors.username ? (
                  <span id="username-error" className="text-red-600 text-sm mt-1" role="alert">
                    {fieldErrors.username}
                  </span>
                ) : (
                  <span id="username-help" className="text-gray-500 text-xs mt-1">
                    3-20 characters, letters, numbers, and underscores only
                  </span>
                )}
              </div>

              {/* password field */}
              <div className="flex flex-col gap-1 mb-8">
                <label
                  htmlFor="password"
                  className="text-sm text-[#73726e] font-medium"
                >
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
                    tabIndex={isLoading ? -1 : 0}
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
                      <span className="text-xs font-medium capitalize text-gray-600">
                        {passwordStrength}
                      </span>
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

              {/** Confirm Password Field */}
              <div className="flex flex-col gap-1 mb-4">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm text-[#73726e] font-medium"
                >
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
                    tabIndex={isLoading ? -1 : 0}
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

              {/* CAPTCHA Widget - Clerk will inject the CAPTCHA */}
              <div id="clerk-captcha" className="mb-4"></div>

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
                <Link
                  href="/signin"
                  className="text-[#1371FF] hover:underline focus:underline"
                  tabIndex={isLoading ? -1 : 0}
                >
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