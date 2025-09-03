'use client'

import {motion } from 'framer-motion';
import { useState } from 'react';
import { IoLockClosed } from 'react-icons/io5';
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePassword(){

    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if(!password || !confirmPassword){
            setError("Both fields are required.");
            setSuccess('');
            return;
        }

        if(password.length < 6){
            setError("Password should be at least 6 characters long");
            setSuccess("");
        }

        if(password !== confirmPassword){
            setError("Passwords do not match.");
            setSuccess("");
            return;
        }

        setError("");

        
    }

    const getInputBorder = (value: string, isFocused: boolean) => {
        if (value || isFocused) return 'border-[#0077d4]';
        return 'border-[#dcd9d3]';
    };

    return (
        <div className="min-h-screen flex flex-col bg-center font-MyFont bg-transparent bg-[radial-gradient(#000000_1px,#e5e5f7_1px)] bg-[length:30px_30px] ">

            <main className='flex flex-1 justify-center items-center m-8 rounded-[20px]'>

                <motion.div className='flex flex-col justify-center bg-white rounded-3xl p-8 z-1 border-3'
                initial={{opacity:0, y:40}}
                animate={{opacity:1, y:0}}
                transition={{duration:0.6, ease: 'easeOut'}}>

                    <div className='flex justify-center items-center'>
                        <IoLockClosed className='w-20 h-20 text-[#73726e]'/>
                    </div>

                    <section className='flex flex-col justify-center m-4 items-center'>

                        <p className='text-xl font-medium text-[#1e1e1e] mb-8 font-MyFont'>Reset your password</p>

                        <form onSubmit={handleSubmit} className='flex flex-1 flex-col justify-center items-center text-[#1e1e1e] font-MyFont'>
                                <div className="relative w-100 mb-6">
                                    <label className="text-sm font-medium text-[#73726e] flex-1">
                                      Password {!password && <span className="text-red-600">*</span>}
                                    </label>
                                    <input
                                        type={showPassword ? 'text': 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={()=> setFocusedField('password')}
                                        onBlur={()=> setFocusedField('')}
                                        className={`w-full py-2 pl-3 pr-10 border-3 bg-white rounded-lg text-[#1e1e1e] font-MyFont ${getInputBorder(password, focusedField === 'password')} focus:outline-none focus-border-[#0077d4]`}
                                    />
                                    <button
                                        type='button'
                                        onClick={()=> setShowPassword(!showPassword)}
                                        className='absolute right-4 top-8.5 cursor-pointer'
                                    >
                                        {showPassword ? (
                                            <FaEye size={24}/>
                                        ):(
                                            <FaEyeSlash size={24}/>
                                        )}
                                    </button>
                                </div>

                                <div className='relative w-100 mb-6'>
                                    <label className="text-sm font-medium text-[#73726e] flex-1">
                                      Confirm Password {!confirmPassword && <span className="text-red-600">*</span>}
                                    </label>
                                    <input
                                        type={showConfirmPassword ? 'text':'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onFocus={()=> setFocusedField('password')}
                                        onBlur={()=> setFocusedField('')}
                                        className={`w-full py-2 pl-3 pr-10 border-3 bg-white rounded-lg  ${getInputBorder(confirmPassword, focusedField === 'confirmPassword')} focus:outline-none focus:border-[#0077d4]`}
                                    />
                                    <button
                                        type='button'
                                        onClick={()=> setShowConfirmPassword(!showConfirmPassword)}
                                        className='absolute right-4 top-8.5 cursor-pointer'
                                    >
                                        {showConfirmPassword ? (
                                            <FaEye size={24}/>
                                        ):(
                                            <FaEyeSlash size={24}/>
                                        )}
                                    </button>
                                    <div className="h-5 mt-1">
                                      {error && <p className="text-sm text-red-500">{error}</p>}
                                      {success && <p className="text-sm text-green-500">{success}</p>}
                                    </div>
                                </div>
                            <div className='flex flex-col mb-4'>
                                <button
                                    onClick={handleSubmit}>
                                    
                                </button>
                            </div>
                        </form>
                    </section>
                </motion.div>
            </main>
        </div>
    )
}

