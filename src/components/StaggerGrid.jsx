import { motion } from "motion/react";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/** Parent for a grid/list of cards — animates children in with a stagger
 * as the group scrolls into view. Pair with <StaggerItem>. */
export function StaggerGrid({ children, className = "" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** One card/item inside a <StaggerGrid> — fades/slides in on its turn,
 * lifts slightly on hover. Set hover={false} for non-card items. */
export function StaggerItem({ children, className = "", hover = true, ...props }) {
  return (
    <motion.div
      variants={item}
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
