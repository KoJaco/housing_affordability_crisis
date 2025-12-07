import { motion, AnimatePresence } from "framer-motion";

interface PageLoadingOverlayProps {
    isLoading: boolean;
    message?: string;
}

export function PageLoadingOverlay({
    isLoading,
    message,
}: PageLoadingOverlayProps) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-0 left-0 right-0 z-50 h-1 overflow-hidden"
                >
                    <motion.div
                        className="h-full bg-primary relative"
                        initial={{ width: "0%" }}
                        animate={{
                            width: "100%",
                        }}
                        exit={{ width: "100%" }}
                        transition={{
                            duration: 0.8,
                            ease: "easeInOut",
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                                x: ["-100%", "200%"],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
