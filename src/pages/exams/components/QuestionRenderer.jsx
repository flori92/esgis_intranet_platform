import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Radio, RadioGroup, FormControlLabel, Checkbox,
  FormGroup, TextField, Button, Chip, IconButton, Tooltip
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Flag as FlagIcon,
  FlagOutlined as FlagOutlinedIcon,
  Image as ImageIcon
} from '@mui/icons-material';

/**
 * Types de questions supportés selon la spécification ESGIS Campus §6.1
 * 
 * - qcm_single    : QCM à réponse unique
 * - qcm_multiple  : QCM à réponses multiples
 * - true_false     : Vrai / Faux
 * - short_answer   : Réponse courte (1 ligne)
 * - long_answer    : Réponse longue / Dissertation
 * - numeric        : Réponse numérique avec tolérance
 * - matching       : Association / Correspondance
 * - ordering       : Ordonnancement
 * - fill_blank     : Complétion de texte à trous
 * - image_question : Question sur image
 */

/**
 * Composant de rendu universel pour tous les types de questions
 * @param {Object} props
 * @param {Object} props.question - Objet question avec type, texte, options, etc.
 * @param {*} props.answer - Réponse actuelle de l'étudiant
 * @param {Function} props.onAnswerChange - Callback quand la réponse change
 * @param {boolean} props.flagged - Question marquée pour relecture
 * @param {Function} props.onToggleFlag - Toggle du marquage
 * @param {number} props.questionNumber - Numéro de la question
 * @param {number} props.totalQuestions - Nombre total de questions
 * @param {boolean} [props.readOnly] - Mode lecture seule (pour correction)
 * @param {boolean} [props.showCorrection] - Afficher les corrections
 */
const QuestionRenderer = ({
  question,
  answer,
  onAnswerChange,
  flagged = false,
  onToggleFlag,
  questionNumber,
  totalQuestions,
  readOnly = false,
  showCorrection = false
}) => {
  if (!question) return null;

  const getPointsLabel = () => {
    const pts = question.points || 1;
    return `${pts} point${pts > 1 ? 's' : ''}`;
  };

  /**
   * Rendu QCM à réponse unique
   */
  const renderSingleChoice = () => (
    <RadioGroup
      value={answer ?? ''}
      onChange={(e) => onAnswerChange(e.target.value)}
    >
      {(question.options || []).map((option, idx) => {
        const isCorrect = showCorrection && question.correct_answer === String(idx);
        const isSelected = answer === String(idx);
        const isWrong = showCorrection && isSelected && !isCorrect;

        return (
          <Paper
            key={idx}
            variant="outlined"
            sx={{
              p: 1.5, mb: 1, cursor: readOnly ? 'default' : 'pointer',
              borderColor: isCorrect ? 'success.main' : isWrong ? 'error.main' : isSelected ? 'primary.main' : 'grey.300',
              bgcolor: isCorrect ? 'success.50' : isWrong ? 'error.50' : isSelected ? 'primary.50' : 'transparent',
              '&:hover': readOnly ? {} : { borderColor: 'primary.main', bgcolor: 'primary.50' }
            }}
            onClick={() => !readOnly && onAnswerChange(String(idx))}
          >
            <FormControlLabel
              value={String(idx)}
              control={<Radio disabled={readOnly} size="small" />}
              label={<Typography variant="body1">{option}</Typography>}
              sx={{ m: 0, width: '100%' }}
            />
          </Paper>
        );
      })}
    </RadioGroup>
  );

  /**
   * Rendu QCM à réponses multiples
   */
  const renderMultipleChoice = () => {
    const selectedAnswers = Array.isArray(answer) ? answer : [];

    const handleToggle = (idx) => {
      if (readOnly) return;
      const strIdx = String(idx);
      const newAnswers = selectedAnswers.includes(strIdx)
        ? selectedAnswers.filter(a => a !== strIdx)
        : [...selectedAnswers, strIdx];
      onAnswerChange(newAnswers);
    };

    return (
      <FormGroup>
        {(question.options || []).map((option, idx) => {
          const strIdx = String(idx);
          const isChecked = selectedAnswers.includes(strIdx);
          const correctAnswers = Array.isArray(question.correct_answer) ? question.correct_answer.map(String) : [];
          const isCorrect = showCorrection && correctAnswers.includes(strIdx);
          const isWrong = showCorrection && isChecked && !isCorrect;

          return (
            <Paper
              key={idx}
              variant="outlined"
              sx={{
                p: 1.5, mb: 1, cursor: readOnly ? 'default' : 'pointer',
                borderColor: isCorrect ? 'success.main' : isWrong ? 'error.main' : isChecked ? 'primary.main' : 'grey.300',
                bgcolor: isCorrect ? 'success.50' : isWrong ? 'error.50' : isChecked ? 'primary.50' : 'transparent',
                '&:hover': readOnly ? {} : { borderColor: 'primary.main' }
              }}
              onClick={() => handleToggle(idx)}
            >
              <FormControlLabel
                control={<Checkbox checked={isChecked} disabled={readOnly} size="small" />}
                label={<Typography variant="body1">{option}</Typography>}
                sx={{ m: 0 }}
              />
            </Paper>
          );
        })}
      </FormGroup>
    );
  };

  /**
   * Rendu Vrai / Faux
   */
  const renderTrueFalse = () => (
    <RadioGroup
      value={answer ?? ''}
      onChange={(e) => onAnswerChange(e.target.value)}
      row
    >
      {[{ value: 'true', label: 'Vrai' }, { value: 'false', label: 'Faux' }].map(opt => {
        const isCorrect = showCorrection && question.correct_answer === opt.value;
        const isSelected = answer === opt.value;
        const isWrong = showCorrection && isSelected && !isCorrect;

        return (
          <Paper
            key={opt.value}
            variant="outlined"
            sx={{
              p: 2, mr: 2, minWidth: 120, textAlign: 'center',
              cursor: readOnly ? 'default' : 'pointer',
              borderColor: isCorrect ? 'success.main' : isWrong ? 'error.main' : isSelected ? 'primary.main' : 'grey.300',
              bgcolor: isCorrect ? 'success.50' : isWrong ? 'error.50' : isSelected ? 'primary.50' : 'transparent',
              '&:hover': readOnly ? {} : { borderColor: 'primary.main' }
            }}
            onClick={() => !readOnly && onAnswerChange(opt.value)}
          >
            <FormControlLabel
              value={opt.value}
              control={<Radio disabled={readOnly} />}
              label={<Typography variant="h6">{opt.label}</Typography>}
              sx={{ m: 0 }}
            />
          </Paper>
        );
      })}
    </RadioGroup>
  );

  /**
   * Rendu réponse courte
   */
  const renderShortAnswer = () => (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Saisissez votre réponse..."
      value={answer || ''}
      onChange={(e) => onAnswerChange(e.target.value)}
      disabled={readOnly}
      sx={{ mt: 1 }}
      inputProps={{ maxLength: 500 }}
    />
  );

  /**
   * Rendu réponse longue / dissertation
   */
  const renderLongAnswer = () => {
    const wordCount = (answer || '').trim().split(/\s+/).filter(Boolean).length;
    const maxWords = question.max_words || 2000;

    return (
      <Box>
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          placeholder="Rédigez votre réponse..."
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={readOnly}
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {wordCount} mot{wordCount > 1 ? 's' : ''}
          </Typography>
          {maxWords && (
            <Typography variant="caption" color={wordCount > maxWords ? 'error.main' : 'text.secondary'}>
              Maximum : {maxWords} mots
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  /**
   * Rendu réponse numérique
   */
  const renderNumeric = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
      <TextField
        type="number"
        variant="outlined"
        placeholder="Entrez un nombre..."
        value={answer ?? ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={readOnly}
        sx={{ maxWidth: 200 }}
        inputProps={{ step: question.step || 'any' }}
      />
      {question.unit && (
        <Typography variant="body1" color="text.secondary">
          {question.unit}
        </Typography>
      )}
      {question.tolerance && showCorrection && (
        <Chip
          label={`Tolérance: ±${question.tolerance}`}
          size="small"
          color="info"
          variant="outlined"
        />
      )}
    </Box>
  );

  /**
   * Rendu association / correspondance
   */
  const renderMatching = () => {
    const leftItems = question.left_items || [];
    const rightItems = question.right_items || [];
    const matchAnswers = answer || {};

    const handleMatch = (leftIdx, rightIdx) => {
      if (readOnly) return;
      onAnswerChange({ ...matchAnswers, [leftIdx]: rightIdx });
    };

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Associez chaque élément de gauche avec l'élément correspondant à droite.
        </Typography>
        {leftItems.map((leftItem, leftIdx) => (
          <Paper key={leftIdx} variant="outlined" sx={{ p: 2, mb: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, fontWeight: 'bold' }}>
              <Typography variant="body1">{leftItem}</Typography>
            </Box>
            <Typography variant="body1" sx={{ mx: 1 }}>→</Typography>
            <Box sx={{ flex: 1 }}>
              <RadioGroup
                value={matchAnswers[leftIdx] ?? ''}
                onChange={(e) => handleMatch(leftIdx, e.target.value)}
                row
                sx={{ flexWrap: 'wrap' }}
              >
                {rightItems.map((rightItem, rightIdx) => (
                  <FormControlLabel
                    key={rightIdx}
                    value={String(rightIdx)}
                    control={<Radio size="small" disabled={readOnly} />}
                    label={rightItem}
                    sx={{ mr: 2 }}
                  />
                ))}
              </RadioGroup>
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  /**
   * Rendu ordonnancement
   */
  const renderOrdering = () => {
    const items = Array.isArray(answer) && answer.length > 0
      ? answer
      : (question.items || []).map((item, idx) => ({ id: idx, text: item }));

    const moveItem = (fromIdx, toIdx) => {
      if (readOnly || toIdx < 0 || toIdx >= items.length) return;
      const newItems = [...items];
      const [moved] = newItems.splice(fromIdx, 1);
      newItems.splice(toIdx, 0, moved);
      onAnswerChange(newItems);
    };

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Réorganisez les éléments dans le bon ordre en utilisant les flèches.
        </Typography>
        {items.map((item, idx) => (
          <Paper
            key={item.id ?? idx}
            variant="outlined"
            sx={{
              p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: 'grey.50', '&:hover': { bgcolor: 'primary.50' }
            }}
          >
            <DragIcon sx={{ color: 'grey.400' }} />
            <Chip label={idx + 1} size="small" color="primary" sx={{ minWidth: 32 }} />
            <Typography variant="body1" sx={{ flex: 1 }}>
              {typeof item === 'string' ? item : item.text}
            </Typography>
            {!readOnly && (
              <Box>
                <IconButton size="small" onClick={() => moveItem(idx, idx - 1)} disabled={idx === 0}>
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => moveItem(idx, idx + 1)} disabled={idx === items.length - 1}>
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  };

  /**
   * Rendu complétion de texte à trous
   */
  const renderFillBlank = () => {
    const blanks = answer || {};
    const textParts = (question.text_with_blanks || '').split(/(\{\{blank_\d+\}\})/g);

    return (
      <Box sx={{ mt: 1, lineHeight: 2.5 }}>
        {textParts.map((part, idx) => {
          const blankMatch = part.match(/\{\{blank_(\d+)\}\}/);
          if (blankMatch) {
            const blankId = blankMatch[1];
            return (
              <TextField
                key={idx}
                variant="outlined"
                size="small"
                placeholder="..."
                value={blanks[blankId] || ''}
                onChange={(e) => onAnswerChange({ ...blanks, [blankId]: e.target.value })}
                disabled={readOnly}
                sx={{
                  mx: 0.5, width: 150, display: 'inline-flex', verticalAlign: 'middle',
                  '& .MuiOutlinedInput-root': { bgcolor: 'warning.50' }
                }}
                inputProps={{ style: { textAlign: 'center', padding: '4px 8px' } }}
              />
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </Box>
    );
  };

  /**
   * Rendu question sur image
   */
  const renderImageQuestion = () => (
    <Box sx={{ mt: 1 }}>
      {question.image_url && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Box
            component="img"
            src={question.image_url}
            alt="Image de la question"
            sx={{
              maxWidth: '100%', maxHeight: 400, borderRadius: 2,
              border: '1px solid', borderColor: 'grey.300'
            }}
          />
          {question.image_caption && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {question.image_caption}
            </Typography>
          )}
        </Box>
      )}
      {/* Le type de réponse pour les questions sur image peut varier */}
      {question.answer_type === 'qcm_single' ? renderSingleChoice() :
       question.answer_type === 'qcm_multiple' ? renderMultipleChoice() :
       question.answer_type === 'short_answer' ? renderShortAnswer() :
       renderLongAnswer()}
    </Box>
  );

  /**
   * Sélection du rendu selon le type de question
   */
  const renderQuestionBody = () => {
    switch (question.type) {
      case 'qcm_single': return renderSingleChoice();
      case 'qcm_multiple': return renderMultipleChoice();
      case 'true_false': return renderTrueFalse();
      case 'short_answer': return renderShortAnswer();
      case 'long_answer': return renderLongAnswer();
      case 'numeric': return renderNumeric();
      case 'matching': return renderMatching();
      case 'ordering': return renderOrdering();
      case 'fill_blank': return renderFillBlank();
      case 'image_question': return renderImageQuestion();
      default:
        return (
          <Typography color="error">
            Type de question non supporté : {question.type}
          </Typography>
        );
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      {/* En-tête de la question */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Chip
            label={`Q${questionNumber}`}
            color="primary"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label={getPointsLabel()}
            variant="outlined"
            size="small"
          />
          <Chip
            label={getTypeLabel(question.type)}
            variant="outlined"
            size="small"
            color="info"
          />
        </Box>
        {onToggleFlag && (
          <Tooltip title={flagged ? 'Retirer le marquage' : 'Marquer pour relecture'}>
            <IconButton onClick={onToggleFlag} color={flagged ? 'warning' : 'default'} size="small">
              {flagged ? <FlagIcon /> : <FlagOutlinedIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Texte de la question */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        {question.text}
      </Typography>

      {/* Instructions spécifiques */}
      {question.instructions && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
          {question.instructions}
        </Typography>
      )}

      {/* Corps de la question */}
      {renderQuestionBody()}

      {/* Correction (mode affichage) */}
      {showCorrection && question.explanation && (
        <Paper sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
          <Typography variant="subtitle2" color="info.main" gutterBottom>
            Explication
          </Typography>
          <Typography variant="body2">{question.explanation}</Typography>
        </Paper>
      )}
    </Paper>
  );
};

/**
 * Retourne le libellé français du type de question
 */
function getTypeLabel(type) {
  const labels = {
    qcm_single: 'QCM unique',
    qcm_multiple: 'QCM multiple',
    true_false: 'Vrai/Faux',
    short_answer: 'Réponse courte',
    long_answer: 'Dissertation',
    numeric: 'Numérique',
    matching: 'Association',
    ordering: 'Ordonnancement',
    fill_blank: 'Texte à trous',
    image_question: 'Question sur image'
  };
  return labels[type] || type;
}

export default QuestionRenderer;
