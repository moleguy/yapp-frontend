'use client'

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdLockReset } from "react-icons/md";
import { IoIosArrowBack } from "react-icons/io";
import Link from 'next/link';

export default function ForgetPassword(){
    const [email, setEmail] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [error, setError] = useState('');

    // logic here to validate if field's email input match with the db one or not

    const validateEmail = (value: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
          setError("Please enter a valid email address.");
          return;
        }

        setError("");
        // logic here to call API to send code and redirecting towards 
        console.log("Code sent to: ", email);
    };

    const getInputBorder = (value: string, isFocused: boolean) => {
        if (value || isFocused) return 'border-[#0077d4]';
        return 'border-[#dcd9d3]';
    };

    return (
        <div className="min-h-screen flex flex-col bg-center font-MyFont bg-transparent bg-[radial-gradient(#000000_1px,#e5e5f7_1px)] bg-[length:30px_30px] ">

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
                        <p className='text-xl font-medium text-[#a7a7a7] mb-8 font-MyFont'>
                            Enter your email to reset your password.
                        </p>
                        <form onSubmit={handleSubmit} className='flex flex-col justify-center items-center flex-1 text-[#1e1e1e] font-MyFont'>
                            <div className='flex flex-col gap-1 mb-6'>
                                <label className="text-sm text-[#73726e] font-medium">
                                  Email {!email && <span className="text-red-600">*</span>}
                                </label>
                                <input
                                    type="email"
                                    className={`rounded-lg px-2 py-3 w-100 mb-2 bg-white text-black font-light border-3 ${getInputBorder(email, focusedField === 'email')} focus:outline-none focus:border-[#0077d4]`}
                                    value={email}
                                    onChange={(e)=>{
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField('')}
                                    required
                                />
                                <div className="h-5 mt-1">
                                    {error && <p className="text-sm text-red-500">{error}</p>}
                                </div>
                            </div>

                            <div className="flex flex-col mb-4">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!email}
                                    type='submit'
                                    className='bg-[#2383E2] text-white py-3 rounded-lg text-lg w-100 cursor-pointer hover:bg-[#0077d4] font-medium'
                                >
                                    Send Code
                                </button>
                            </div>
                        </form>

                        <Link href="/signin">
                            <div className='flex justify-center items-center gap-4 mt-2'>
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