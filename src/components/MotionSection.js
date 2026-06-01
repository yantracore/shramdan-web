"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  fadeUpInView,
  staggerContainer,
  staggerItem
} from "@/lib/motion";

// Section wrapper — fades up + translates 12px when it enters the viewport.
// Honors prefers-reduced-motion by skipping the animation entirely.
//
// Usage:
//   <MotionSection as="section" className="event-types-section" ...>
//     <div>section content</div>
//   </MotionSection>
//
// The `as` prop chooses the rendered HTML tag (section / div / article).
export function MotionSection({ as = "section", children, className, ...rest }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const Comp = motion[as] ?? motion.section;
  return (
    <Comp className={className} {...rest} {...fadeUpInView}>
      {children}
    </Comp>
  );
}

// Grid / list wrapper — each direct child fades + stagger-rises as the
// container enters the viewport. Pair with <StaggerItem> for each child.
export function StaggerList({ as = "div", children, className, ...rest }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp className={className} {...rest} {...staggerContainer}>
      {children}
    </Comp>
  );
}

// Direct child of StaggerList. Acts as a plain wrapper under reduced motion.
export function StaggerItem({ as = "div", children, className, ...rest }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp className={className} {...rest} {...staggerItem}>
      {children}
    </Comp>
  );
}
