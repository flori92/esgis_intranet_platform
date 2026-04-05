/**
 * API Gestion des Paiements — ESGIS Campus §5.2
 */
import { supabase } from '../supabase';

const DEFAULT_TUITION_BY_LEVEL = {
  L1: 850000,
  L2: 850000,
  L3: 850000,
  M1: 950000,
  M2: 950000,
};

const getCurrentAcademicYear = () => {
  const today = new Date();
  const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  return `${year}-${year + 1}`;
};

const formatDepartmentLabel = (student, departmentMap) => {
  const departmentName = departmentMap.get(student.profile?.department_id) || '';
  return `${student.level || ''} ${departmentName}`.trim() || student.level || '-';
};

const getCompletedAmount = (payments) => {
  return (payments || [])
    .filter((payment) => payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
};

/** Recupere le statut financier de tous les etudiants */
export const getAllPaymentStatuses = async (filters = {}) => {
  try {
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        level,
        status,
        profile:profiles!profile_id(
          id,
          full_name,
          department_id
        )
      `)
      .order('created_at', { ascending: false });

    if (studentError) {
      throw studentError;
    }

    const departmentIds = [...new Set((students || []).map((item) => item.profile?.department_id).filter(Boolean))];
    const departmentMap = new Map();

    if (departmentIds.length) {
      const { data: departments, error: departmentError } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);

      if (departmentError) {
        throw departmentError;
      }

      (departments || []).forEach((department) => {
        departmentMap.set(department.id, department.name);
      });
    }

    let paymentQuery = supabase
      .from('payments')
      .select('id, student_id, amount, payment_date, payment_method, reference_number, description, academic_year, semester, status')
      .order('payment_date', { ascending: false });

    if (filters.academicYear) {
      paymentQuery = paymentQuery.eq('academic_year', filters.academicYear);
    }
    if (filters.semester) {
      paymentQuery = paymentQuery.eq('semester', filters.semester);
    }

    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) {
      throw paymentError;
    }

    const paymentsByStudent = new Map();
    (payments || []).forEach((payment) => {
      if (!paymentsByStudent.has(payment.student_id)) {
        paymentsByStudent.set(payment.student_id, []);
      }
      paymentsByStudent.get(payment.student_id).push(payment);
    });

    const result = (students || [])
      .filter((student) => !filters.studentStatus || student.status === filters.studentStatus)
      .map((student) => {
        const studentPayments = paymentsByStudent.get(student.id) || [];
        const amountPaid = getCompletedAmount(studentPayments);
        const amountDue = DEFAULT_TUITION_BY_LEVEL[student.level] || 850000;
        const balance = Math.max(0, amountDue - amountPaid);
        const latestPayment = studentPayments[0] || null;
        const academicYear = latestPayment?.academic_year || filters.academicYear || getCurrentAcademicYear();
        const semester = latestPayment?.semester || filters.semester || 1;

        return {
          id: student.id,
          student_id: student.id,
          profile_id: student.profile?.id || null,
          student_name: student.profile?.full_name || '-',
          filiere: formatDepartmentLabel(student, departmentMap),
          annee_academique: academicYear,
          semester,
          montant_du: amountDue,
          montant_paye: amountPaid,
          solde: balance,
          statut: balance === 0 ? 'payé' : amountPaid > 0 ? 'partiel' : 'impayé',
          paiements: studentPayments,
          derniere_date: latestPayment?.payment_date || null,
          methode: latestPayment?.payment_method || '-',
          reference: latestPayment?.reference_number || '-',
        };
      });

    return { data: result, error: null };
  } catch (error) {
    console.error('getAllPaymentStatuses:', error);
    return { data: null, error };
  }
};

/** Enregistre un nouveau versement */
export const recordPayment = async (paymentData) => {
  try {
    const studentId = paymentData.student_id || paymentData.etudiant_id;
    if (!studentId) {
      throw new Error('student_id requis pour enregistrer un paiement');
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, profile_id, level')
      .eq('id', studentId)
      .single();

    if (studentError) {
      throw studentError;
    }

    const payload = {
      student_id: student.id,
      amount: paymentData.montant,
      payment_date: paymentData.date || new Date().toISOString(),
      payment_method: paymentData.methode,
      reference_number: paymentData.reference || `PAY-${Date.now()}`,
      description: paymentData.motif || 'Frais de scolarité',
      academic_year: paymentData.academic_year || getCurrentAcademicYear(),
      semester: paymentData.semester || 1,
      status: 'completed',
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabase.from('payment_records').insert({
      etudiant_id: student.profile_id,
      montant: paymentData.montant,
      methode: paymentData.methode,
      reference: payload.reference_number,
      date_versement: (paymentData.date || new Date().toISOString()).split('T')[0],
      enregistre_par: paymentData.enregistre_par || null,
    });

    return { data, error: null };
  } catch (error) {
    console.error('recordPayment:', error);
    return { data: null, error };
  }
};

/** Recupere l'historique des paiements d'un etudiant */
export const getStudentPayments = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Statistiques financieres globales */
export const getPaymentStats = async () => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('status', 'completed');

    if (error) throw error;

    const totalEncaisse = (data || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return { data: { totalEncaisse, count: data?.length || 0 }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
