import { Box, Flex, Image, usePrefersReducedMotion } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type LogoItem = {
  id: string | number;
  src: string;
  alt?: string;
  size?: number;
};

type FloatingLogoCloudProps = {
  logos: LogoItem[];
  speed?: number; // horizontal drift duration
  height?: string | number;
  bg?: string;
};

const driftX = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const floatA = keyframes`
  0%   { transform: translate3d(0px, 0px, 0); }
  25%  { transform: translate3d(6px, -10px, 0); }
  50%  { transform: translate3d(0px, -18px, 0); }
  75%  { transform: translate3d(-6px, -8px, 0); }
  100% { transform: translate3d(0px, 0px, 0); }
`;

const floatB = keyframes`
  0%   { transform: translate3d(0px, 0px, 0); }
  20%  { transform: translate3d(-8px, 8px, 0); }
  50%  { transform: translate3d(4px, 18px, 0); }
  80%  { transform: translate3d(10px, 6px, 0); }
  100% { transform: translate3d(0px, 0px, 0); }
`;

const floatC = keyframes`
  0%   { transform: translate3d(0px, 0px, 0); }
  30%  { transform: translate3d(10px, -6px, 0); }
  60%  { transform: translate3d(-6px, 12px, 0); }
  100% { transform: translate3d(0px, 0px, 0); }
`;

const floatD = keyframes`
  0%   { transform: translate3d(0px, 0px, 0); }
  25%  { transform: translate3d(-4px, -12px, 0); }
  50%  { transform: translate3d(8px, -20px, 0); }
  75%  { transform: translate3d(6px, -8px, 0); }
  100% { transform: translate3d(0px, 0px, 0); }
`;

const animations = [floatA, floatB, floatC, floatD];

const positions = [
  { top: "16%", left: "8%" },
  { top: "34%", left: "16%" },
  { top: "56%", left: "12%" },
  { top: "22%", left: "24%" },
  { top: "44%", left: "28%" },
  { top: "68%", left: "24%" },

  { top: "14%", left: "38%" },
  { top: "32%", left: "46%" },
  { top: "58%", left: "40%" },
  { top: "72%", left: "50%" },

  { top: "18%", left: "58%" },
  { top: "42%", left: "64%" },
  { top: "64%", left: "60%" },

  { top: "24%", left: "76%" },
  { top: "50%", left: "82%" },
  { top: "20%", left: "90%" },
];


export default function FloatingLogoCloud({
  logos,
  speed = 36,
  height = "520px",
  bg = "#f5f6f8",
}: FloatingLogoCloudProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const visibleLogos = logos.slice(0, 17);
  const doubledLogos = [...visibleLogos, ...visibleLogos];

  return (
    <Box
      position="relative"
      w="full"
      h={height}
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        bg="
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7) 0%, transparent 22%),
          radial-gradient(circle at 80% 25%, rgba(255,255,255,0.55) 0%, transparent 20%),
          radial-gradient(circle at 60% 75%, rgba(255,255,255,0.45) 0%, transparent 18%)
        "
        pointerEvents="none"
      />

      <Box
        position="relative"
        w="150%"
        h="100%"
        animation={
          prefersReducedMotion ? undefined : `${driftX} ${speed}s linear infinite`
        }
      >
        {doubledLogos.map((logo, index) => {
          const basePosition = positions[index % positions.length];
          const animationName = animations[index % animations.length];
          const size = logo.size ?? [84, 96, 110, 88, 118, 100][index % 6];
          const duration = 5 + (index % 4);

          const sectionOffset = index < visibleLogos.length ? 0 : 100;
          const leftValue = `calc(${basePosition.left} + ${sectionOffset}%)`;

          return (
            <Box
              key={`${logo.id}-${index}`}
              position="absolute"
              top={basePosition.top}
              left={leftValue}
              transform="translate(-50%, -50%)"
              zIndex={1}
            >
              <Box
                animation={
                  prefersReducedMotion
                    ? undefined
                    : `${animationName} ${duration}s ease-in-out infinite`
                }
              >
                <Flex
                  w={`${size}px`}
                  h={`${size}px`}
                  borderRadius="full"
                  bg="rgba(255,255,255,0.78)"
                  backdropFilter="blur(6px)"
                  border="1px solid rgba(148, 163, 184, 0.14)"
                  boxShadow="0 8px 24px rgba(15, 23, 42, 0.06)"
                  align="center"
                  justify="center"
                  overflow="hidden"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt || "company logo"}
                    w="100%"
                    h="100%"
                    objectFit="contain"
                    p="18%"
                    draggable={false}
                    userSelect="none"
                  />
                </Flex>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        position="absolute"
        left={0}
        top={0}
        h="full"
        w={{ base: "36px", md: "72px", xl: "120px" }}
        pointerEvents="none"
        bgGradient={`linear(to-r, ${bg}, transparent)`}
        zIndex={2}
      />
      <Box
        position="absolute"
        right={0}
        top={0}
        h="full"
        w={{ base: "36px", md: "72px", xl: "120px" }}
        pointerEvents="none"
        bgGradient={`linear(to-l, ${bg}, transparent)`}
        zIndex={2}
      />
    </Box>
  );
}
