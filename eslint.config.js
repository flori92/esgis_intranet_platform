import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'assets', '**/*.test.jsx', '**/*.test.js', '**/*.spec.jsx', '**/*.spec.js'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        supabase: 'readonly',
        mockCandidatures: 'readonly',
        fetchRecords: 'readonly',
        insertRecord: 'readonly',
        updateRecord: 'readonly',
        deleteRecord: 'readonly',
        format: 'readonly',
        fr: 'readonly',
        mockData: 'readonly',
        mockCourses: 'readonly',
        mockProfessors: 'readonly',
        mockStudents: 'readonly',
        mockGrades: 'readonly',
        mockExams: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
