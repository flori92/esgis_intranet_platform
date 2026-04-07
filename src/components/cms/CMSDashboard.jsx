import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Grid, CircularProgress, Alert, Typography } from '@mui/material';
import styled from 'styled-components';

import HeroBanner from '@/components/cms/HeroBanner';
import { EventCardComponent } from '@/components/cms/EventCardComponent';
import { NewsCardComponent } from '@/components/cms/NewsCardComponent';

import { eventsService, newsService, bannersService } from '@/services/cmsService';

/**
 * Styles
 */
const SectionTitle = styled(Typography)`
  font-size: 28px !important;
  font-weight: 800 !important;
  margin-bottom: 24px !important;
  color: #1a1a1a !important;
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: '';
    width: 4px;
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    font-size: 20px !important;
  }
`;

const DashboardSection = styled(Box)`
  margin-bottom: 48px;
`;

/**
 * Composant principal du dashboard moderne avec CMS
 */
export const CMSDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data
  const [banners, setBanners] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);

  /**
   * Load all CMS data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bannersData, eventsData, newsData] = await Promise.all([
        bannersService.getActive(),
        eventsService.getPublished(),
        newsService.getPublished()
      ]);

      setBanners(bannersData);
      setEvents(eventsData);
      setNews(newsData);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewsView = (newsItem) => {
    // Navigate to news detail page
    window.location.href = `/news/${newsItem.id}`;
  };

  const handleEventView = (event) => {
    // Navigate to event detail page
    window.location.href = `/events/${event.id}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Hero Banners */}
        <DashboardSection>
          {banners.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {banners.map((banner) => (
                <HeroBanner
                  key={banner.id}
                  title={banner.title}
                  subtitle={banner.subtitle}
                  image_url={banner.image_url}
                  backgroundColor={banner.background_color}
                  textColor={banner.text_color}
                  cta_text={banner.cta_text}
                  cta_link={banner.cta_link}
                />
              ))}
            </Box>
          )}
        </DashboardSection>

        {/* Events Section */}
        {events.length > 0 && (
          <DashboardSection>
            <SectionTitle variant="h5">
              📅 Événements à venir
            </SectionTitle>
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <EventCardComponent event={event} onView={handleEventView} />
                </Grid>
              ))}
            </Grid>
          </DashboardSection>
        )}

        {/* News Section */}
        {news.length > 0 && (
          <DashboardSection>
            <SectionTitle variant="h5">
              📰 Dernières actualités
            </SectionTitle>
            <Grid container spacing={3}>
              {news.map((newsItem) => (
                <Grid item xs={12} sm={6} md={4} key={newsItem.id}>
                  <NewsCardComponent
                    news={newsItem}
                    featured={newsItem.is_featured}
                    onView={handleNewsView}
                  />
                </Grid>
              ))}
            </Grid>
          </DashboardSection>
        )}

        {/* Empty state */}
        {banners.length === 0 && events.length === 0 && news.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="#999">
              Aucun contenu disponible pour le moment
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CMSDashboard;
