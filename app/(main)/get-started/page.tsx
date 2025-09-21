"use client";

import React from "react";
import Image from "next/image";
import right from "../../assets/images/right.png";
import yapLogo from "../../assets/images/yappLogo.png";
import Link from "next/link";
import comm from "../../assets/images/communication.png";
import { motion, Variants } from "framer-motion";

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0,
        },
    },
};

const lineVariants: Variants = {
    hidden: { y: 60, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: {
            ease: "easeIn",
            duration: 1,
        },
    },
};

export default function CoverPage() {
    return (
        <div
            className="flex flex-col min-h-screen bg-[#F3F3F3] [--color:#E1E1E1]
          bg-[linear-gradient(0deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color)_25%,var(--color)_26%,transparent_27%,transparent_74%,var(--color)_75%,var(--color)_76%,transparent_77%,transparent)] bg-[length:55px_55px]"
        >
            {/* Header */}
            <header className="flex justify-left items-center">
                <div className="ml-8 mt-8 flex justify-center items-center">
                    <Image className="w-7" src={yapLogo} alt="Yapp logo" />
                </div>
            </header>

            {/* Main */}
            <main className="relative flex-1 flex flex-col justify-between items-center m-6 md:m-8 rounded-[20px] gap-12 md:gap-20 overflow-hidden">
                <div className="flex flex-1 flex-col justify-start items-center h-full w-full p-6 md:p-10">
                    {/* Headings */}
                    <motion.div
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center mt-6 mb-8 leading-tight text-[#1e1e1e] font-Heading"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        <motion.h1 variants={lineVariants}>CONNECT.</motion.h1>
                        <motion.h1 variants={lineVariants}>COLLABORATE.</motion.h1>
                        <motion.h1 variants={lineVariants}>COMMUNICATE.</motion.h1>
                    </motion.div>

                    {/* Subtitle + Button */}
                    <div className="flex flex-col justify-center items-center z-10 text-center max-w-3xl">
                        <motion.p
                            className="subtitle text-lg sm:text-2xl md:text-3xl text-[#1e1e1e] font-MyFont mb-8 tracking-tight"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            The fast, friendly way to stay connected with the people who
                            matter most.
                        </motion.p>

                        <Link href="/signin">
                            <motion.button
                                className="flex items-center gap-2 bg-[#1e1e1e] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-black cursor-pointer"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            >
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <p className="text-lg md:text-2xl font-[SF_Pro_Rounded]">
                                        Get Started
                                    </p>
                                    <Image
                                        className="w-4 h-4 md:w-5 md:h-5"
                                        src={right}
                                        alt="right-arrow"
                                        priority
                                    />
                                </motion.div>
                            </motion.button>
                        </Link>
                    </div>

                    {/* Background image */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] xl:w-[70%] max-w-6xl opacity-100">
                        <Image
                            src={comm}
                            alt="communication"
                            className="w-full h-auto object-contain"
                            priority
                        />
                    </div>


                </div>
            </main>
        </div>
    );
}
