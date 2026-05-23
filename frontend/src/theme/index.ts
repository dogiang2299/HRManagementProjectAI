import { extendTheme } from '@chakra-ui/react';
import { colors } from './colors';

export const theme = extendTheme({
  styles: {
    global: {
      '.hide-scrollbar': {
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },
      '.candidate-scroll-reveal': {
        opacity: 0,
        transform: 'translate3d(0, 18px, 0)',
        transition:
          'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 580ms cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: 'var(--candidate-reveal-delay, 0ms)',
        willChange: 'opacity, transform',
      },
      '.candidate-scroll-reveal.is-visible': {
        opacity: 1,
        transform: 'translate3d(0, 0, 0)',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '.candidate-scroll-reveal': {
          opacity: 1,
          transform: 'none',
          transition: 'none',
        },
      },
    },
  },
  colors: {
    ...colors.baseColors,
    ...colors.textColors,
    ...colors.bgColors,
    ...colors.tableColors,
    ...colors.inputColors,
    charts: {
      ...colors.charts,
    },
    candidate: {
      ...colors.candidate,
    }
  },
});
export default theme;
