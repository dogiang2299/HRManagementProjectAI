import { useEffect, useRef, type ReactNode } from "react";
import { Box, type BoxProps } from "@chakra-ui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

const MotionBox = motion(Box);

const REVEAL_SELECTOR = [
  "[data-candidate-reveal]",
  "section",
  "article",
  ".chakra-container > *",
  ".chakra-simple-grid > *",
  ".chakra-grid > *",
  ".chakra-wrap > *",
  "[role='group']",
].join(",");

type CandidateRouteMotionProps = {
  children: ReactNode;
  disableScrollReveal?: boolean;
  minH?: BoxProps["minH"];
};

const shouldRevealElement = (element: HTMLElement) => {
  if (element.dataset.candidateMotionIgnore === "true") return false;
  if (element.closest("[data-candidate-motion-ignore='true']")) return false;

  const tagName = element.tagName.toLowerCase();
  if (["button", "input", "select", "textarea", "a"].includes(tagName)) return false;

  const style = window.getComputedStyle(element);
  if (style.position === "fixed" || style.position === "sticky") return false;
  if (style.display === "none" || style.visibility === "hidden") return false;

  const rect = element.getBoundingClientRect();
  return rect.width >= 80 && rect.height >= 24;
};

export default function CandidateRouteMotion({
  children,
  disableScrollReveal = false,
  minH = "inherit",
}: CandidateRouteMotionProps) {
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const routeKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [location.pathname, location.search, prefersReducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion || disableScrollReveal) return;

    const observed = new WeakSet<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    const collectRevealTargets = () => {
      const candidates = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

      candidates.forEach((element, index) => {
        if (observed.has(element) || !shouldRevealElement(element)) return;

        observed.add(element);
        element.classList.add("candidate-scroll-reveal");
        element.style.setProperty("--candidate-reveal-delay", `${Math.min(index % 6, 5) * 42}ms`);
        observer.observe(element);
      });
    };

    const mutationObserver = new MutationObserver(() => {
      window.requestAnimationFrame(collectRevealTargets);
    });

    collectRevealTargets();
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [routeKey, prefersReducedMotion, disableScrollReveal]);

  return (
    <AnimatePresence mode="wait" initial={!prefersReducedMotion}>
      <MotionBox
        key={routeKey}
        ref={rootRef}
        data-candidate-motion-root
        minH={minH}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10, filter: "blur(3px)" }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6, filter: "blur(2px)" }}
        transition={{
          duration: 0.34,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </MotionBox>
    </AnimatePresence>
  );
}
