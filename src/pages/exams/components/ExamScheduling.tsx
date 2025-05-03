import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Grid,
  Paper,
  InputAdornment
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Types pour le composant
interface ExamSchedulingProps {
  date: Date | null;
  setDate: (value: Date | null) => void;
  duration: number;
  setDuration: (value: number) => void;
  sessionId: number | null;
  setSessionId: (value: number | null) => void;
  centerId: number | null;
  setCenterId: (value: number | null) => void;
  room: string;
  setRoom: (value: string) => void;
  sessions: Array<{ id: number; name: string; academic_year: string; semester: number }>;
  centers: Array<{ id: number; name: string; location: string }>;
  errors: {
    date?: string;
    duration?: string;
    sessionId?: string;
    centerId?: string;
    room?: string;
  };
}

/**
 * Composant pour la planification d'un examen
 * Gère la date, la durée, la session, le centre d'examen et la salle
 */
const ExamScheduling: React.FC<ExamSchedulingProps> = ({
  date,
  setDate,
  duration,
  setDuration,
  sessionId,
  setSessionId,
  centerId,
  setCenterId,
  room,
  setRoom,
  sessions,
  centers,
  errors
}) => {
  // Gestionnaire pour la durée
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDuration(value);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Planification de l'examen
      </Typography>
      
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <Grid container spacing={3}>
          {/* Date et heure de l'examen */}
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Date et heure de l'examen"
              value={date}
              onChange={setDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.date,
                  helperText: errors.date
                }
              }}
            />
          </Grid>
          
          {/* Durée de l'examen */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Durée de l'examen"
              type="number"
              InputProps={{ 
                inputProps: { min: 15 },
                endAdornment: <InputAdornment position="end">minutes</InputAdornment>
              }}
              value={duration}
              onChange={handleDurationChange}
              required
              error={!!errors.duration}
              helperText={errors.duration || 'Durée minimale: 15 minutes'}
            />
          </Grid>
          
          {/* Session d'examen */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Session d'examen</InputLabel>
              <Select
                value={sessionId === null ? '' : sessionId}
                onChange={(e) => setSessionId(e.target.value === '' ? null : Number(e.target.value))}
                label="Session d'examen"
              >
                <MenuItem value="">
                  <em>Non spécifié</em>
                </MenuItem>
                {sessions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name} ({session.academic_year}, Semestre {session.semester})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Période académique (ex: Session d'examens de janvier)</FormHelperText>
            </FormControl>
          </Grid>
          
          {/* Centre d'examen */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Centre d'examen</InputLabel>
              <Select
                value={centerId === null ? '' : centerId}
                onChange={(e) => setCenterId(e.target.value === '' ? null : Number(e.target.value))}
                label="Centre d'examen"
                error={!!errors.centerId}
              >
                <MenuItem value="">
                  <em>Non spécifié</em>
                </MenuItem>
                {centers.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.name} ({center.location})
                  </MenuItem>
                ))}
              </Select>
              {errors.centerId ? (
                <FormHelperText error>{errors.centerId}</FormHelperText>
              ) : (
                <FormHelperText>Lieu où se déroulera l'examen</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* Salle */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Salle"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              error={!!errors.room}
              helperText={errors.room || 'Numéro ou nom de la salle (ex: A204, Amphithéâtre B)'}
            />
          </Grid>
        </Grid>
      </LocalizationProvider>
    </Paper>
  );
};

export default ExamScheduling;
