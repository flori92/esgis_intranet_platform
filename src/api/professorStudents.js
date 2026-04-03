import { getProfessorManagedCourses } from './courses';
import { getGradesByCourse, getStudentsByCourse } from './grades';

const normalizeGradeTo20 = (grade) => {
  const value = Number(grade?.note ?? grade?.value ?? 0);
  const maxValue = Number(grade?.max_value || 20);

  if (!maxValue) {
    return value;
  }

  return (value / maxValue) * 20;
};

const buildLatestGradeLabel = (grade) => {
  if (!grade) {
    return 'Aucune evaluation';
  }

  const date = grade.date_evaluation || grade.published_at || grade.created_at || null;
  return {
    evaluationType: grade.type_evaluation || 'Evaluation',
    value: Number(grade.note ?? grade.value ?? 0),
    maxValue: Number(grade.max_value || 20),
    date
  };
};

export const getProfessorCourseStudentsOverview = async ({ profileId, courseId }) => {
  try {
    if (!profileId || !courseId) {
      return { data: null, error: new Error('Cours ou professeur non identifie') };
    }

    const { data: managedCourses, error: coursesError } = await getProfessorManagedCourses(profileId);

    if (coursesError) {
      throw coursesError;
    }

    const selectedCourse = (managedCourses || []).find((course) => Number(course.id) === Number(courseId));

    if (!selectedCourse) {
      throw new Error('Cours non assigne a ce professeur');
    }

    const [{ data: enrollments, error: studentsError }, { data: grades, error: gradesError }] =
      await Promise.all([
        getStudentsByCourse(courseId),
        getGradesByCourse(courseId)
      ]);

    if (studentsError) {
      throw studentsError;
    }

    if (gradesError) {
      throw gradesError;
    }

    const gradesByStudentId = new Map();

    (grades || []).forEach((grade) => {
      const studentGrades = gradesByStudentId.get(grade.student_id) || [];
      studentGrades.push(grade);
      gradesByStudentId.set(grade.student_id, studentGrades);
    });

    const students = (enrollments || []).map((enrollment) => {
      const student = enrollment.etudiant;
      const studentGrades = (gradesByStudentId.get(student.id) || []).slice().sort((left, right) => {
        const leftDate = new Date(left.date_evaluation || left.created_at || 0).getTime();
        const rightDate = new Date(right.date_evaluation || right.created_at || 0).getTime();
        return rightDate - leftDate;
      });

      const normalizedGrades = studentGrades.map(normalizeGradeTo20);
      const average =
        normalizedGrades.length > 0
          ? Number(
              (
                normalizedGrades.reduce((total, gradeValue) => total + gradeValue, 0) /
                normalizedGrades.length
              ).toFixed(2)
            )
          : null;

      return {
        id: student.id,
        profile_id: student.profile_id,
        full_name: student.full_name || 'Etudiant inconnu',
        email: student.email || '',
        level: student.level || '',
        student_number: student.student_number || '',
        academic_year: enrollment.academic_year || null,
        average,
        alert: average !== null && average < 10,
        gradesCount: studentGrades.length,
        latestGrade: buildLatestGradeLabel(studentGrades[0] || null),
        grades: studentGrades
      };
    });

    const averages = students.map((student) => student.average).filter((value) => typeof value === 'number');

    return {
      data: {
        course: selectedCourse,
        students,
        stats: {
          totalStudents: students.length,
          studentsAtRisk: students.filter((student) => student.alert).length,
          classAverage:
            averages.length > 0
              ? Number((averages.reduce((total, value) => total + value, 0) / averages.length).toFixed(2))
              : null,
          publishedGradesCount: (grades || []).filter((grade) => grade.is_published).length
        }
      },
      error: null
    };
  } catch (error) {
    console.error('getProfessorCourseStudentsOverview:', error);
    return { data: null, error };
  }
};
