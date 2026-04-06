import React from 'react';
import { Box, Alert, AlertTitle, IconButton, Collapse } from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import styled from 'styled-components';

/**
 * Mapping des priorités d'annonces
 */
const PRIORITY_CONFIG = {
  high: {
    severity: 'error',
    icon: ErrorIcon,
    color: '#d32f2f',
    background: 'rgba(211, 47, 47, 0.08)'
  },
  medium: {
    severity: 'warning',
    icon: WarningIcon,
    color: '#f57c00',
    background: 'rgba(245, 124, 0, 0.08)'
  },
  normal: {
    severity: 'info',
    icon: InfoIcon,
    color: '#1976d2',
    background: 'rgba(25, 118, 210, 0.08)'
  },
  low: {
    severity: 'success',
    icon: CheckCircleIcon,
    color: '#388e3c',
    background: 'rgba(56, 142, 60, 0.08)'
  }
};

const StyledAnnouncementAlert = styled(Alert)`
  margin-bottom: 16px !important;
  border-radius: 12px !important;
  border: 1px solid currentColor !important;
  animation: slideDown 0.4s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .MuiAlert-message {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  @media (max-width: 768px) {
    margin-bottom: 12px !important;
  }
`;

/**
 * Composant pour afficher une annonce individuellement
 */
export const AnnouncementItem = ({ announcement, onDismiss, dismissible = true }) => {
  const [open, setOpen] = React.useState(true);
  const config = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.normal;

  const handleClose = () => {
    setOpen(false);
    onDismiss && onDismiss(announcement.id);
  };

  return (
    <Collapse in={open}>
      <StyledAnnouncementAlert
        severity={config.severity}
        icon={<config.icon />}
        action={
          dismissible && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
              sx={{
                opacity: 0.7,
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
        sx={{
          background: config.background,
          borderColor: config.color
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>{announcement.title}</AlertTitle>
        <Box sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#333' }}>{announcement.content}</Box>
      </StyledAnnouncementAlert>
    </Collapse>
  );
};

/**
 * Composant pour afficher la liste des annonces
 */
export const AnnouncementsSection = ({ announcements = [], onDismiss, dismissible = true }) => {
  // Trier par priorité (high, medium, normal, low)
  const priorityOrder = { high: 0, medium: 1, normal: 2, low: 3 };
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
  );

  if (announcements.length === 0) {
    return null;
  }

  return (
    <Box sx={{ marginBottom: 3 }}>
      {sortedAnnouncements.map((announcement) => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          onDismiss={onDismiss}
          dismissible={dismissible}
        />
      ))}
    </Box>
  );
};

export default AnnouncementsSection;
