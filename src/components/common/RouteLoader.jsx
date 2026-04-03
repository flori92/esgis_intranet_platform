import { Box, CircularProgress, Typography } from '@mui/material';

const RouteLoader = ({ fullScreen = false, label = 'Chargement...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: fullScreen ? '100vh' : 240,
      gap: 2
    }}
  >
    <CircularProgress size={48} />
    <Typography color="text.secondary">{label}</Typography>
  </Box>
);

export default RouteLoader;
