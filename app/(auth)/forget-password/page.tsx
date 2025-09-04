'use client'

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdLockReset } from "react-icons/md";
import { IoIosArrowBack } from "react-icons/io";
import Link from 'next/link';






export default function ForgetPassword(){
    const [email, setEmail] = useState('');
    const [focusedField, setFocusedField] = useState('');
    // const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [formError, setFormError] = useState('');
    const [announceError, setAnnounceError] = useState('');

    // logic here to validate if field's email input match with the db one or not

    const validateEmail = (value: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // validate all fields
        const errors: Record<string, string> = {};
    
        const rules: { [key: string]: () => string | null } = {
          email: () =>
            !email.trim()
              ? 'Email is required'
              : !validateEmail(email)
              ? 'Please enter a valid email address'
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
      };

    const getInputBorder = (value: string, isFocused: boolean, hasError: boolean = false) => {
        if (hasError) return 'border-red-500';
        if (value || isFocused) return 'border-[#0077d4]';
        return 'border-[#dcd9d3]';
    };

    const validateField = useCallback((field: string, value: string) => {
        const errors = { ...fieldErrors };

        const rules: Record<string, (val: string) => string | null> = {
            email: val => (val && !validateEmail(val) ? 'Please enter a valid email address' : null),
        };

        const error = rules[field]?.(value) || null;
        if(error){
          errors[field] = error;
        } else {
          delete errors[field];
        }

        setFieldErrors(errors);
    }, [fieldErrors]);

    const handleInputChange = (field: string, value: string) => {

        const setters: Record<string, (val: string) => void> = {
          email: setEmail
        };

        setters[field]?.(value);
        validateField(field, value);
        if (formError) setFormError('');
    };

    const isFormValid = email.trim() && validateEmail(email) &&  Object.keys(fieldErrors).length === 0;

    return (
        <div className="min-h-screen flex flex-col bg-center font-MyFont bg-transparent bg-[radial-gradient(#000000_1px,#e5e5f7_1px)] bg-[length:30px_30px] ">

            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announceError}
            </div>

            <main className='flex-1 flex justify-center items-center m-8 rounded-[20px]'>

                <motion.div className='flex flex-col justify-center bg-white rounded-3xl p-8 z-1 border-3'
                initial={{opacity:0, y:40}}
                animate={{opacity:1, y:0}}
                transition={{duration:0.6, ease: 'easeOut'}}>

                    {/* for maybe yapp logo but doesn't suit here */}
                    {/* <div className='flex justify-start items-start'>
                        <a href="/get-started" className={`flex flex-row justify-start items-start relative -inset-2`}><Image className='w-5' src={logo} alt='Yapp Logo'/></a>
                    </div> */}

                    <div className='flex justify-center items-center'>
                        <MdLockReset size={80} color="#73726e" />
                    </div>

                    <section className='flex flex-col justify-center m-4 items-center'>

                        <p className='text-xl font-semibold font-MyFont text-[#1e1e1e]'>Forgot your password?</p>
                        <p className='text-xl font-base text-[#a7a7a7] mb-8 font-MyFont'>
                            Enter your email to reset your password.
                        </p>
                        <form onSubmit={handleSubmit} className='flex flex-col justify-center items-center flex-1 text-[#1e1e1e] font-MyFont'
                        noValidate>
                            <div className='flex flex-col gap-1 mb-6'>
                                <label 
                                htmlFor="email"
                                className="text-sm text-[#73726e] font-medium">
                                  Email {!email && <span className="text-red-600" aria-label="required">*</span>}
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`rounded-lg px-2 py-3 w-100 mb-2 bg-white text-black font-light border-3 ${getInputBorder(email, focusedField === 'email', !!fieldErrors.email)} focus:outline-none focus:border-[#0077d4]`}
                                    value={email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField('')}
                                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                                    aria-invalid={!!fieldErrors.email}
                                    required
                                />
                                {fieldErrors.email && (
                                    <span id="email-error" className="text-red-600 text-sm mt-1" role="alert">
                                      {fieldErrors.email}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col mb-4">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!isFormValid}
                                    type='submit'
                                    className='bg-[#2383E2] text-white py-3 rounded-lg text-lg w-100 cursor-pointer hover:bg-[#0077d4] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                    aria-describedby="signup-button-description"
                                >
                                    Send Code
                                </button>
                            </div>
                        </form>

                        <Link href="/signin" className='w-full'>
                            <div className='flex justify-center items-center border-3 py-3 rounded-lg bg-white mt-2'>
                            <IoIosArrowBack size={24} color="#1e1e1e" />
                            <p className='text-[#1e1e1e]'>Back to Login</p>
                            </div>
                        </Link>    
                    </section>
                </motion.div>
            </main>
        </div>
    )
}