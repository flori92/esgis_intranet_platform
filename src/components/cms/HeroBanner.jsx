import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import styled from 'styled-components';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

/**
 * Styled Components pour le Hero Banner
 */
const HeroBannerWrapper = styled(Box)`
  position: relative;
  width: 100%;
  min-height: 280px;
  overflow: hidden;
  border-radius: 16px;
  margin-bottom: 24px;
  transition: all 0.4s ease;
  background-size: cover;
  background-position: center;

  @media (max-width: 768px) {
    min-height: 200px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
    z-index: 1;
    transition: all 0.4s ease;
  }

  &:hover::before {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
  }
`;

const HeroBannerContent = styled(Box)`
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 40px;
  color: white;

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const HeroTitle = styled(Typography)`
  font-size: 42px !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
  margin-bottom: 12px !important;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: slideInLeft 0.6s ease-out;

  @media (max-width: 768px) {
    font-size: 28px !important;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const HeroSubtitle = styled(Typography)`
  font-size: 18px !important;
  font-weight: 300 !important;
  margin-bottom: 24px !important;
  line-height: 1.6 !important;
  max-width: 600px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  animation: slideInLeft 0.6s ease-out 0.1s backwards;

  @media (max-width: 768px) {
    font-size: 16px !important;
    margin-bottom: 16px !important;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const HeroCTAButton = styled(Button)`
  background: white !important;
  color: #667eea !important;
  font-weight: 700 !important;
  padding: 12px 32px !important;
  text-transform: none !important;
  font-size: 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  animation: slideInLeft 0.6s ease-out 0.2s backwards;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25) !important;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

/**
 * Composant Hero Banner
 */
export const HeroBanner = ({
  title,
  subtitle,
  image_url,
  backgroundColor = '#667eea',
  textColor = '#FFFFFF',
  cta_text,
  cta_link,
  onCTAClick
}) => {
  return (
    <HeroBannerWrapper
      sx={{
        backgroundImage: image_url ? `url(${image_url})` : 'none',
        backgroundColor: !image_url ? backgroundColor : 'transparent'
      }}
      onError={(e) => {
        e.currentTarget.style.backgroundImage = 'none';
      }}
    >
      <HeroBannerContent>
        <HeroTitle sx={{ color: textColor }}>{title}</HeroTitle>

        {subtitle && <HeroSubtitle sx={{ color: textColor }}>{subtitle}</HeroSubtitle>}

        {cta_text && (
          <HeroCTAButton
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              if (onCTAClick) {
                onCTAClick();
              } else if (cta_link) {
                const isExternal = cta_link.startsWith('http');
                if (isExternal) {
                  window.open(cta_link, '_blank');
                } else {
                  window.location.href = cta_link;
                }
              }
            }}
          >
            {cta_text}
          </HeroCTAButton>
        )}
      </HeroBannerContent>
    </HeroBannerWrapper>
  );
};

export default HeroBanner;
