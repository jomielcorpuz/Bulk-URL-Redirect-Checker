"use client";

import { useTheme } from 'next-themes'
import { Button } from './button'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    return (
        <div className='flex items-center gap-2'>
            <div className="flex items-center gap-2">
                {mounted && (
                    <h1
                        onClick={() =>
                            setTheme(resolvedTheme === "light" ? "dark" : "light")
                        }
                        className="cursor-pointer select-none"
                    >
                        {resolvedTheme === "light" ? "Light" : "Dark"} theme
                    </h1>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full flex items-center justify-center"
                onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
            >
                {!mounted ? null : resolvedTheme === "light" ? (
                    <motion.div
                        initial={{ opacity: 0, rotate: 180 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 180 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Moon size={15} />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, rotate: 180, y: -20 }}
                        animate={{ opacity: 1, rotate: 360, y: 0, scale: 1.2 }}
                        exit={{ opacity: 0, rotate: 180 }}
                        transition={{
                            duration: 0.6,
                            ease: "linear",
                            repeatType: "loop",
                        }}
                    >
                        <Sun size={16} />

                    </motion.div>
                )}
            </Button>
        </div>


    )
}
export default ThemeToggle