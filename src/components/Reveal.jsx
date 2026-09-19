import { motion } from "motion/react";

const variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Fade-and-slide-up wrapper that animates once when scrolled into view.
 * Wrap a section's content (or the whole <section>) with this for the
 * scroll-reveal effect used throughout the homepage.
 */
export default function Reveal({ children, delay = 0, className = "", as = "div" }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Component>
  );
}
