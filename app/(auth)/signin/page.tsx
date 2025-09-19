'use client';
import React, {useState, useEffect, useCallback} from 'react';
import {motion} from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../assets/images/yappLogo.png';
import {FaEye, FaSpinner, FaEyeSlash} from 'react-icons/fa';
import {useRouter} from 'next/navigation';
import {useUserStore} from "@/app/store/useUserStore";

const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
};

const validatePassword = (password: string): boolean => password.length >= 8;

export default function SignIn() {
    const router = useRouter();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [announceError, setAnnounceError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {setUser} = useUserStore();

    // Load remember me preference on component mount
    useEffect(() => {
        const rememberMeCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('remember_me='));
        if (rememberMeCookie && rememberMeCookie.split('=')[1] === 'true') {
            setRememberMe(true);
        } else {
            setRememberMe(false);
        }
    }, []);

    const getInputBorder = (value: string, isFocused: boolean, hasError: boolean) => {
        if (hasError) return 'border-red-500';
        return value || isFocused ? 'border-[#0077d4]' : 'border-[#dcd9d3]';
    };

    const validateField = useCallback(
        (field: string, value: string) => {
            const errors = {...fieldErrors};

            if (field === 'email') {
                if (value && !validateEmail(value)) {
                    errors.email = 'Please enter a valid email address';
                } else {
                    delete errors.email;
                }
            }

            if (field === 'password') {
                if (value && !validatePassword(value)) {
                    errors.password = 'Password must be at least 8 characters long';
                } else {
                    delete errors.password;
                }
            }

            setFieldErrors(errors);
        },
        [fieldErrors]
    );

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        validateField('email', value);
        if (formError) setFormError('');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        validateField('password', value);
        if (formError) setFormError('');
    };

    const isFormValid =
        email.trim() &&
        password &&
        validateEmail(email) &&
        validatePassword(password) &&
        Object.keys(fieldErrors).length === 0;

    const signInWithCredentials = async (email: string, password: string, remember: boolean) => {
        setIsLoading(true);
        try {
            const {authSignIn, getUser} = await import('@/lib/api');

            await authSignIn({email: email.trim().toLowerCase(), password});

            // Wait for user info to confirm JWT works
            const user = await getUser();
            if (!user) {
                throw new Error('Failed to fetch user profile');
            }

            console.log('Fetched user after signin:', user); //Remove in production
            user.active = true;

            setUser(user);

            if (remember) {
                document.cookie = `remember_me=true; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
            } else {
                document.cookie = `remember_me=false; max-age=0; path=/; samesite=lax`;
            }

            router.push('/home');
        } catch (error: any) {
            const msg = error?.message || 'Sign In failed. Please try again.';
            setFormError(msg);
            setAnnounceError(msg);
        } finally {
            setIsLoading(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        // Validate all fields
        const errors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!password) {
            errors.password = 'Password is required';
        } else if (!validatePassword(password)) {
            errors.password = 'Password must be at least 8 characters long';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const errorMessage = 'Please fix the form errors before submitting';
            setFormError(errorMessage);
            setAnnounceError(errorMessage);
            return;
        }

        setFormError('');
        setFieldErrors({});

        await signInWithCredentials(email, password, rememberMe);
    };

    return (
        <div className="min-h-screen flex flex-col bg-center font-MyFont bg-[#F3F3F3] [--color:#E1E1E1] \
    bg-[linear-gradient(0deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent)] bg-[length:55px_55px]">
            {/* Screen reader announcements */}
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {announceError}
            </div>

            <main className="flex-1 flex justify-center items-center m-8 rounded-[20px]">
                <motion.div
                    className="flex flex-col justify-center bg-white rounded-3xl p-8 z-10 border-3 max-w-xl border-[#dcd9d3]"
                    initial={{opacity: 0, y: 40}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, ease: 'easeOut'}}
                >
                    <div className="flex justify-start items-start">
                        <Link href="/get-started" className="flex flex-row justify-start items-start relative -inset-2"
                              aria-label="Go back to get started page">
                            <Image className="w-7" src={logo} alt="Yapp Logo" priority/>
                        </Link>
                    </div>

                    <section className="flex flex-col justify-center m-8 mt-2">
                        <p className="text-xl font-medium font-MyFont mt-4 text-[#1e1e1e]">Yapp — Connect. Collaborate.
                            Communicate.</p>
                        <p className="text-xl font-base text-[#B6B09F] mb-8 tracking-wide">Sign In to your Yapp
                            account</p>

                        <form onSubmit={handleSubmit}
                              className="flex flex-col justify-center text-[#1e1e1e] font-[SF_Pro_Rounded]" noValidate>
                            <div className="flex flex-col gap-1 mb-4">
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
                                    onChange={handleEmailChange}
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

                            <div className="flex flex-col gap-1 mb-4">
                                <div className="flex flex-row items-center">
                                    <label htmlFor="password" className="text-sm font-medium text-[#73726e] flex-1">
                                        Password {!password &&
                                        <span className="text-red-600" aria-label="required">*</span>}
                                    </label>
                                    <Link href="/forget-password" className="text-xs text-[#0077d4] hover:underline">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        className={`rounded-lg px-2 py-3 pl-3 w-full pr-12 bg-white text-black font-light border-3 font-MyFont ${getInputBorder(password, focusedField === 'password', !!fieldErrors.password)} focus:outline-none focus:border-[#0077d4] transition-colors`}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField('')}
                                        aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                                        aria-invalid={!!fieldErrors.password}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-4 cursor-pointer hover:text-[#0077d4] transition-colors disabled:cursor-not-allowed"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <FaEye size={20}/> : <FaEyeSlash size={20}/>}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <span id="password-error" className="text-red-600 text-sm mt-1" role="alert">
                    {fieldErrors.password}
                  </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="w-4 h-4 accent-[#0077d4] focus:outline-none"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <label htmlFor="remember-me" className="text-sm font-base cursor-pointer">
                                    Remember Me for 30 days
                                </label>
                            </div>

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
                                    className="bg-[#2383E2] text-white py-3 rounded-lg text-base w-full cursor-pointer hover:bg-[#0077d4] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#0077d4] focus:ring-offset-2"
                                    aria-describedby="Sign-In-button-description"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <FaSpinner className="animate-spin" size={16}/>
                                            Signing in...
                                        </div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                                <div id="Sign In-button-description" className="sr-only">
                                    {!isFormValid && 'Please fill out all required fields correctly to enable Sign In'}
                                </div>
                            </div>

                            <p className="flex justify-center text-sm mt-4 text-[#1e1e1e]">
                                Don&apos;t have an account?{' '}
                                <Link href="/signup" className="text-[#0077d4] ml-2 hover:underline focus:underline">
                                    Sign Up with email
                                </Link>
                            </p>
                        </form>
                    </section>
                </motion.div>
            </main>
        </div>
    );
}