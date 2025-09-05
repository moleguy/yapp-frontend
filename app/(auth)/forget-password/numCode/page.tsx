'use client'

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { CgDesignmodo } from "react-icons/cg";

export default function NumCode(){
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // allowing only digits to be entered
    if (!/^\d$/.test(value)) {
      e.target.value = "";
      return;
    }

    // if digit entered, move to next field
    if (index < inputsRef.current.length - 1 && value) {
      inputsRef.current[index + 1]?.focus();
    }
  };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      // moving to previous input field on backspace
      inputsRef.current[index - 1]?.focus();
    }
  };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // matching code with the input logic here
    }

    return (
        <div className="min-h-screen flex flex-col bg-center font-MyFont bg-[#F3F3F3] [--color:#E1E1E1] 
        bg-[linear-gradient(0deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent)] bg-[length:55px_55px]">

            <main className="flex flex-1 justify-center items-center m-8 rounded-[20px]">

                <motion.div className='flex flex-col justify-center bg-white rounded-3xl p-8 z-1 border-3 border-[#dcd9d3]'
                initial={{opacity:0, y:40}}
                animate={{opacity:1, y:0}}
                transition={{duration:0.6, ease: 'easeOut'}}>

                    <div className='flex justify-center items-center'>
                        <CgDesignmodo className='w-20 h-20 text-[#73726e]'/>
                    </div>

                    <section className="flex flex-col justify-center m-4 items-center">

                        <p className="text-xl font-medium text-[#1e1e1e] mb-8 font-MyFont">
                            Enter the code we&apos;ve send to your Email
                        </p>
                        <form onSubmit={handleSubmit}
                        className='flex flex-col justify-center items-center flex-1 text-[#1e1e1e] font-MyFont'>

                            <div className="flex justify-center items-center gap-2 mb-4">

                                {Array.from({ length: 6 }).map((_, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        maxLength={1}
                                        className={`w-16 h-16 text-center text-2xl font-semibold border-3 
                                        border-[#dcd9d3] rounded-lg focus:outline-none focus:border-[#0077d4] ${i === 3 ? "ml-4" : ""}`}
                                        onChange={(e) => handleChange(e, i)}
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        ref={(el) => { inputsRef.current[i] = el; }}
                                        />
                                    ))}
                            </div>

                            <div className="flex items-center my-2 w-full" role="separator" aria-label="or">
                                <div className="flex-grow h-px bg-gray-400 opacity-35" />
                                {/* <span className="px-2 text-gray-500 text-sm">or</span> */}
                                <div className="flex-grow h-px bg-gray-400 opacity-35" />
                            </div>

                            <div className='flex justify-center items-center mt-3'>
                                <p>Didn&apos;t recieve a code?</p>
                                <button className='text-[#0077d4] pl-2 cursor-pointer'>Resend.</button>
                            </div>
                        </form>
                    </section>
                </motion.div>
            </main>

        </div>
    )
}