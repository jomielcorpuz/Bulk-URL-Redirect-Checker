import { motion, useAnimation } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface TechStackItem {
    icon: string;
    name: string;
}

function TechIconLoop({
    techStack,
    resolvedTheme,
    mounted,
}: {
    techStack: TechStackItem[];
    resolvedTheme: string | undefined;
    mounted: boolean;
}) {
    const controls = useAnimation();
    const containerRef = useRef(null);

    useEffect(() => {
        controls.start({
            x: ["0%", "-50%"],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 20,
                    ease: "linear",
                },
            },
        });
    }, [controls]);

    return (
        <div
            ref={containerRef}
            className="overflow-hidden w-full"
            onMouseEnter={() => controls.stop()}
            onMouseLeave={() =>
                controls.start({
                    x: ["0%", "-50%"],
                    transition: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 20,
                        ease: "linear",
                    },
                })
            }
        >
            <motion.div className="flex gap-4 w-max items-center" animate={controls}>
                {[...techStack, ...techStack].map(({ icon, name }, index) => (
                    <div
                        key={index}
                        className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                    >
                        {mounted && (
                            <Image
                                src={
                                    resolvedTheme === "dark" &&
                                        ["MySQL", "PHP", "Android", "Git", "GitHub"].includes(name)
                                        ? `/icons/${name.toLowerCase()}-white.png`
                                        : icon
                                }
                                alt={name}
                                width={16}
                                height={16}
                                className="w-full h-full object-contain aspect-square"
                            />
                        )}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export default TechIconLoop;
