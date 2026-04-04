import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  finalizeStudentExamSubmission,
  getStudentExamLaunchData,
  syncExamAnswers
} from '@/api/exams';
import {
  getExamQuestions,
  recordActiveStudent,
  recordCheatingAttempt,
  updateActiveStudent
} from '@/api/quiz';
import {
  computeExamQuestionScore,
  isExamQuestionAutoGradable,
  normalizeExamQuestion
} from '@/utils/examQuestionUtils';

const getInitialAnswerValue = (question) => {
  switch (question.question_type) {
    case 'qcm_multiple':
      return [];
    case 'matching':
    case 'fill_blank':
      return {};
    case 'ordering':
      return (question.items || []).map((item, index) => ({
        id: index,
        text: item
      }));
    default:
      return '';
  }
};

export const useQuiz = () => {
  const { id: examIdParam } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const examId = Number(examIdParam);

  const [quizStatus, setQuizStatus] = useState('NOT_STARTED');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState({ minutes: 0, seconds: 0 });
  const [examData, setExamData] = useState(null);
  const [studentExamId, setStudentExamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [scoreSummary, setScoreSummary] = useState(null);

  const timerIntervalRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const cheatingAttemptsRef = useRef(0);
  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const timerRef = useRef({ minutes: 0, seconds: 0 });
  const examDataRef = useRef(null);
  const studentExamIdRef = useRef(null);

  const clearRuntimeIntervals = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  const calculateScore = useCallback(() => {
    return questions.reduce((total, question) => {
      if (!isExamQuestionAutoGradable(question)) {
        return total;
      }

      return total + Number(computeExamQuestionScore(question, answers[question.id]) || 0);
    }, 0);
  }, [answers, questions]);

  const countCorrectAnswers = useCallback(() => {
    return questions.reduce((total, question) => {
      if (!isExamQuestionAutoGradable(question)) {
        return total;
      }

      return total + (Number(computeExamQuestionScore(question, answers[question.id]) || 0) >= Number(question.points || 0) ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    examDataRef.current = examData;
  }, [examData]);

  useEffect(() => {
    studentExamIdRef.current = studentExamId;
  }, [studentExamId]);

  const submitQuiz = useCallback(async () => {
    if (!examDataRef.current || !studentExamIdRef.current || !authState.profile?.id || !authState.student?.id) {
      return;
    }

    clearRuntimeIntervals();
    
    // Clear local backup on submission
    localStorage.removeItem(`exam_backup_${examId}`);

    const currentQuestions = questionsRef.current;
    const currentAnswers = answersRef.current;
    const currentTimer = timerRef.current;
    const currentExam = examDataRef.current;
    const autoScore = currentQuestions.reduce((total, question) => {
      if (!isExamQuestionAutoGradable(question)) {
        return total;
      }

      return total + Number(computeExamQuestionScore(question, currentAnswers[question.id]) || 0);
    }, 0);
    const hasManualQuestions = currentQuestions.some((question) => !isExamQuestionAutoGradable(question));
    const maxScore = currentQuestions.reduce((total, question) => total + Number(question.points || 0), 0);
    const percentage = maxScore > 0 ? Math.round((autoScore / maxScore) * 100) : 0;

    try {
      const completionTime = currentExam.duration * 60 - (currentTimer.minutes * 60 + currentTimer.seconds);
      const { error: submitError } = await finalizeStudentExamSubmission({
        studentExamId: studentExamIdRef.current,
        examId,
        profileId: authState.profile.id,
        answers: currentAnswers,
        score: autoScore,
        totalQuestions: currentQuestions.length,
        completionTime,
        cheatingAttempts: cheatingAttemptsRef.current,
        hasManualQuestions,
        passingGrade: currentExam.passing_grade
      });

      if (submitError) {
        throw submitError;
      }

      await updateActiveStudent(authState.profile.id, examId, false);

      setScoreSummary({
        score: autoScore,
        maxScore,
        percentage,
        passed: hasManualQuestions ? null : autoScore >= Number(currentExam.passing_grade || 0),
        hasManualQuestions
      });
      setQuizStatus('COMPLETED');
      toast.success('Examen soumis avec succès.');
    } catch (submitError) {
      console.error("Erreur lors de la soumission de l'examen:", submitError);
      toast.error("Erreur lors de la soumission de l'examen.");
    }
  }, [
    authState.profile?.id,
    authState.student?.id,
    clearRuntimeIntervals,
    examId,
  ]);

  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.isStudent || !authState.student?.id || !authState.profile?.id) {
          throw new Error('Accès non autorisé');
        }

        const { exam, studentExam, error: launchError } = await getStudentExamLaunchData({
          examId,
          studentId: authState.student.id
        });

        if (launchError) {
          throw launchError;
        }

        if (!['published', 'in_progress'].includes(exam.status)) {
          throw new Error("Cet examen n'est pas disponible.");
        }

        if (studentExam.attempt_status === 'submitted') {
          throw new Error("Cet examen a déjà été soumis.");
        }

        const { questions: fetchedQuestions, error: questionsError } = await getExamQuestions(examId);

        if (questionsError) {
          throw questionsError;
        }

        if (!fetchedQuestions || fetchedQuestions.length === 0) {
          throw new Error("Aucune question n'est disponible pour cet examen.");
        }

        const normalizedQuestions = fetchedQuestions.map((question) => normalizeExamQuestion(question));
        
        // Priority: Local Storage > DB Answers > Default Empty
        const localBackup = localStorage.getItem(`exam_backup_${examId}`);
        const existingAnswers = localBackup 
          ? JSON.parse(localBackup) 
          : (typeof studentExam.answers === 'string'
            ? JSON.parse(studentExam.answers || '{}')
            : (studentExam.answers || {}));
            
        const initialAnswers = {};

        normalizedQuestions.forEach((question) => {
          initialAnswers[question.id] = existingAnswers[question.id] ?? getInitialAnswerValue(question);
        });

        setExamData(exam);
        setStudentExamId(studentExam.id);
        setQuestions(normalizedQuestions);
        setAnswers(initialAnswers);
        setCheatingAttempts(0);
        cheatingAttemptsRef.current = 0;
        setCurrentQuestionIndex(0);

        const now = new Date();
        const examStartedAt = studentExam.arrival_time ? new Date(studentExam.arrival_time) : null;

        if (studentExam.attempt_status === 'in_progress' && examStartedAt) {
          const resumeEndTime = new Date(examStartedAt.getTime() + Number(exam.duration || 0) * 60000);
          endTimeRef.current = resumeEndTime;

          if (resumeEndTime <= now) {
            setTimer({ minutes: 0, seconds: 0 });
            setQuizStatus('IN_PROGRESS');
            setTimeout(() => submitQuiz(), 0);
          } else {
            const diff = resumeEndTime.getTime() - now.getTime();
            setTimer({
              minutes: Math.floor(diff / 60000),
              seconds: Math.floor((diff % 60000) / 1000)
            });
            setQuizStatus('IN_PROGRESS');
          }
        } else {
          setTimer({ minutes: Number(exam.duration || 0), seconds: 0 });
          setQuizStatus('NOT_STARTED');
        }
      } catch (loadError) {
        console.error("Erreur lors du chargement de l'examen:", loadError);
        setError(loadError.message || "Impossible de charger l'examen.");
        toast.error(loadError.message || "Impossible de charger l'examen.");
        setTimeout(() => {
          navigate('/student/exams');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();

    return () => {
      clearRuntimeIntervals();
    };
  }, [
    authState.isStudent,
    authState.profile?.id,
    authState.student?.id,
    clearRuntimeIntervals,
    examId,
    navigate,
    submitQuiz
  ]);

  useEffect(() => {
    if (quizStatus !== 'IN_PROGRESS' || !examData || !authState.profile?.id) {
      return undefined;
    }

    const syncTimer = () => {
      const now = new Date();
      const diff = endTimeRef.current ? endTimeRef.current.getTime() - now.getTime() : 0;

      if (diff <= 0) {
        setTimer({ minutes: 0, seconds: 0 });
        submitQuiz();
        return;
      }

      setTimer({
        minutes: Math.floor(diff / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      });
    };

    syncTimer();
    timerIntervalRef.current = setInterval(syncTimer, 1000);
    
    pingIntervalRef.current = setInterval(() => {
      updateActiveStudent(authState.profile.id, examId, true);
    }, 30000);

    // Auto-sync answers to DB every 60 seconds
    syncIntervalRef.current = setInterval(() => {
      if (studentExamIdRef.current && Object.keys(answersRef.current).length > 0) {
        syncExamAnswers({
          studentExamId: studentExamIdRef.current,
          answers: answersRef.current
        });
      }
    }, 60000);

    return () => {
      clearRuntimeIntervals();
    };
  }, [
    authState.profile?.id,
    clearRuntimeIntervals,
    examData,
    examId,
    quizStatus,
    studentExamId,
    submitQuiz
  ]);

  const startQuiz = useCallback(async () => {
    if (quizStatus !== 'NOT_STARTED' || !examData || !authState.profile?.id) {
      return;
    }

    const now = new Date();
    endTimeRef.current = new Date(now.getTime() + Number(examData.duration || 0) * 60000);
    setQuizStatus('IN_PROGRESS');

    await recordActiveStudent({
      student_id: authState.profile.id,
      exam_id: examId,
      start_time: now.toISOString(),
      last_ping: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    });

    toast.success("L'examen a commencé. Bonne chance.");
  }, [authState.profile?.id, examData, examId, quizStatus]);

  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((previous) => Math.min(previous + 1, questions.length - 1));
  }, [questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex((previous) => Math.max(previous - 1, 0));
  }, []);

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const saveAnswer = useCallback((questionId, answer) => {
    setAnswers((previous) => {
      const nextAnswers = {
        ...previous,
        [questionId]: answer
      };
      
      // Immediate local backup
      localStorage.setItem(`exam_backup_${examId}`, JSON.stringify(nextAnswers));
      
      return nextAnswers;
    });
  }, [examId]);

  const reportCheatingAttemptHandler = useCallback(async () => {
    if (quizStatus !== 'IN_PROGRESS' || !authState.profile?.id) {
      return;
    }

    cheatingAttemptsRef.current += 1;
    setCheatingAttempts(cheatingAttemptsRef.current);

    await recordCheatingAttempt({
      student_id: authState.profile.id,
      exam_id: examId,
      student_exam_id: studentExamId,
      details: "Sortie d'onglet ou perte de focus detectee",
      attempt_count: cheatingAttemptsRef.current,
      detected_at: new Date().toISOString()
    });

    if (cheatingAttemptsRef.current >= 3) {
      toast.error("Trop de tentatives de triche detectees. Soumission automatique.");
      submitQuiz();
    }
  }, [authState.profile?.id, examId, quizStatus, studentExamId, submitQuiz]);

  return {
    quizStatus,
    questions,
    currentQuestionIndex,
    answers,
    userAnswers: answers,
    timer,
    examData,
    loading,
    error,
    cheatingAttempts,
    scoreSummary,
    startQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    saveAnswer,
    answerQuestion: saveAnswer,
    submitQuiz,
    endQuiz: submitQuiz,
    reportCheatingAttempt: reportCheatingAttemptHandler,
    calculateScore,
    countCorrectAnswers
  };
};
