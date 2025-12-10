import {
    useRef,
    ReactNode,
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect,
} from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedContentProps {
    children: ReactNode;
    distance?: number;
    direction?: "vertical" | "horizontal";
    reverse?: boolean;
    duration?: number;
    initialOpacity?: number;
    animateOpacity?: boolean;
    scale?: number;
    threshold?: number;
    delay?: number;
    className?: string;
    style?: React.CSSProperties;
    enableScrollUp?: boolean; // New prop to enable scroll-up animations
    // Add any other specific props you need here
}

const AnimatedContent = forwardRef<HTMLDivElement, AnimatedContentProps>(
    (
        {
            children,
            distance = 100,
            direction = "vertical",
            reverse = false,
            duration = 0.5,
            initialOpacity = 0,
            animateOpacity = true,
            scale = 1,
            threshold = 0.1,
            delay = 0,
            className,
            style,
            enableScrollUp = false,
        },
        forwardedRef
    ) => {
        const localRef = useRef<HTMLDivElement>(null);
        const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
        const [lastScrollY, setLastScrollY] = useState(0);
        
        const isInView = useInView(localRef, {
            once: !enableScrollUp, // If scroll-up is enabled, don't use 'once'
            amount: threshold,
        });

        // Track scroll direction when enableScrollUp is true
        useEffect(() => {
            if (!enableScrollUp) return;
            
            const handleScroll = () => {
                const currentScrollY = window.scrollY;
                setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
                setLastScrollY(currentScrollY);
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => window.removeEventListener('scroll', handleScroll);
        }, [lastScrollY, enableScrollUp]);

        useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);

        const directionKey = direction === "vertical" ? "y" : "x";
        const initialOffset = reverse ? -distance : distance;
        
        // Determine animation direction based on scroll direction when enableScrollUp is true
        const getAnimationOffset = () => {
            if (!enableScrollUp) return initialOffset;
            
            // When scrolling up, animate from opposite direction
            if (scrollDirection === 'up') {
                return reverse ? distance : -distance;
            }
            return initialOffset;
        };

        return (
            <motion.div
                ref={localRef}
                initial={{
                    [directionKey]: getAnimationOffset(),
                    opacity: animateOpacity ? initialOpacity : 1,
                    scale: scale,
                }}
                animate={
                    isInView
                        ? {
                            [directionKey]: 0,
                            opacity: 1,
                            scale: 1,
                        }
                        : enableScrollUp
                        ? {
                            [directionKey]: getAnimationOffset(),
                            opacity: animateOpacity ? initialOpacity : 1,
                            scale: scale,
                        }
                        : undefined
                }
                transition={{
                    duration: duration,
                    delay: delay / 1000, // Convert ms to s for framer-motion
                    ease: "easeOut",
                }}
                className={className}
                style={style}
            >
                {children}
            </motion.div>
        );
    }
);

AnimatedContent.displayName = "AnimatedContent";

export default AnimatedContent;