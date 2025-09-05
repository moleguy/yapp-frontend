'use client'

import {motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { IoLockClosed } from 'react-icons/io5';
import { FaEye, FaTimes, FaCheck, FaEyeSlash } from "react-icons/fa";

enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong'
}

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

export default function ChangePassword(){

    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [announceError, setAnnounceError] = useState('');
    const [formError, setFormError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};

        const rules: { [key: string]: () => string | null} = {
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
                    : null
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
    }

    const getInputBorder = (value: string, isFocused: boolean, hasError: boolean = false) => {
        if (hasError) return 'border-red-500';
        if (value || isFocused) return 'border-[#0077d4]';
        return 'border-[#dcd9d3]';
    };

    const validateField = useCallback((field: string, value: string) => {
        const errors = {...fieldErrors};
         
        const rules: Record<string, (val: string) => string | null> = {
            password: val => {
                const res = validatePassword(val);
                return val && !res.isValid ? 'Password requirements not met.': null;
            },
            confirmPassword: val => (val && val !== password ? 'Passwords do not match': null )
        }

        const error = rules[field]?.(value) || null;
        if(error){
            errors[field] = error;
        } else {
            delete errors[field];
        }

        setFieldErrors(errors);
    }, [fieldErrors, password]);

    const handleInputChange = (field: string, value: string) => {
        const setters: Record<string, (value: string) => void> = {
            password: val => {
                setPassword(val);
                if(confirmPassword) validateField('confirmPassword', confirmPassword);
            },
            confirmPassword: setConfirmPassword,
        }

        setters[field]?.(value);
        validateField(field, value);
        if(formError) setFormError("");
    }

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

    const isFormValid =  password && confirmPassword && password === confirmPassword &&
    passwordValidation.isValid && Object.keys(fieldErrors).length === 0;

    return (
        <div className="min-h-screen flex flex-col bg-center font-MyFont bg-[#F3F3F3]     [--color:#E1E1E1] 
          bg-[linear-gradient(0deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent)] bg-[length:55px_55px]">

        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {announceError}
        </div>

            <main className='flex flex-1 justify-center items-center m-8 rounded-[20px]'>

                <motion.div className='flex flex-col justify-center bg-white rounded-3xl p-8 z-1 border-3 border-[#dcd9d3]'
                initial={{opacity:0, y:40}}
                animate={{opacity:1, y:0}}
                transition={{duration:0.6, ease: 'easeOut'}}>

                    <div className='flex justify-center items-center'>
                        <IoLockClosed className='w-20 h-20 text-[#73726e]'/>
                    </div>

                    <section className='flex flex-col justify-center m-4 items-center'>

                        <p className='text-xl font-medium text-[#1e1e1e] mb-8 font-MyFont'>Reset your password</p>

                        <form onSubmit={handleSubmit} className='flex flex-1 flex-col justify-center items-center text-[#1e1e1e] font-MyFont' noValidate>
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
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 cursor-pointer hover:text-[#0077d4] transition-colors disabled:cursor-not-allowed"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                                  Confirm Password {!confirmPassword && <span className="text-red-600" aria-label="required">*</span>}
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
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3.5 cursor-pointer hover:text-[#0077d4] transition-colors disabled:cursor-not-allowed"
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
                            <div className="flex flex-col gap-2 w-full">
                                <button
                                  type="submit"
                                  disabled={!isFormValid}
                                  className="bg-[#2383E2] text-white py-3 rounded-lg text-lg w-full cursor-pointer hover:bg-[#0077d4] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#0077d4] focus:ring-offset-2"
                                  aria-describedby="signup-button-description"
                                >
                                  <p className='flex justify-center items-center text-white'>Reset Password</p>
                                </button>
                                <div id="signup-button-description"                     className="sr-only"
                                >
                                      {!isFormValid && 'Please fill out all required fields correctly to create account'}
                                </div>
                            </div>
                        </form>
                    </section>
                </motion.div>
            </main>
        </div>
    )
}

