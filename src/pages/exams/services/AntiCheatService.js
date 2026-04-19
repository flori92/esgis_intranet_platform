/**
 * Service Anti-Triche Avancé — ESGIS Campus §6.3
 * 
 * Implémente les mesures de sécurité suivantes :
 * - Détection de sortie d'onglet/fenêtre avec horodatage
 * - Désactivation du copier-coller
 * - Désactivation du clic droit
 * - Détection du passage en arrière-plan
 * - Mode plein écran obligatoire (desktop)
 * - Journal de connexion (IP, appareil, navigateur)
 * - Rapport d'intégrité automatique
 */

/**
 * @typedef {Object} CheatIncident
 * @property {string} type - Type d'incident
 * @property {string} timestamp - Horodatage ISO
 * @property {string} details - Description de l'incident
 * @property {number} questionIndex - Index de la question au moment de l'incident
 */

/**
 * @typedef {Object} IntegrityReport
 * @property {string} examId - ID de l'examen
 * @property {string} studentId - ID de l'étudiant
 * @property {string} startedAt - Début de l'examen
 * @property {string} completedAt - Fin de l'examen
 * @property {Array<CheatIncident>} incidents - Liste des incidents
 * @property {Object} connectionInfo - Infos de connexion
 * @property {Object} timeAnalysis - Analyse des temps par question
 * @property {number} riskScore - Score de risque (0-100)
 */

class AntiCheatService {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.maxTabSwitches = options.maxTabSwitches || 3;
    this.autoSubmitOnMaxSwitches = options.autoSubmitOnMaxSwitches || false;
    this.disableCopyPaste = options.disableCopyPaste !== false;
    this.disableRightClick = options.disableRightClick !== false;
    this.requireFullscreen = options.requireFullscreen || false;
    this.onIncident = options.onIncident || (() => {});
    this.onAutoSubmit = options.onAutoSubmit || (() => {});
    this.onFullscreenExit = options.onFullscreenExit || (() => {});

    // État interne
    this.incidents = [];
    this.tabSwitchCount = 0;
    this.currentQuestionIndex = 0;
    this.questionStartTimes = {};
    this.questionDurations = {};
    this.startTime = null;
    this.isActive = false;
    this.isFullscreen = false;
    this.lastFullscreenDeniedAt = 0;

    // Handlers stockés pour le cleanup
    this._handlers = {};

    // Informations de connexion
    this.connectionInfo = this._collectConnectionInfo();
  }

  /**
   * Collecte les informations de connexion de l'étudiant
   */
  _collectConnectionInfo() {
    const ua = navigator.userAgent;
    let browser = 'Inconnu';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    let os = 'Inconnu';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return {
      userAgent: ua,
      browser,
      os,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enregistre un incident
   */
  _recordIncident(type, details) {
    const incident = {
      type,
      timestamp: new Date().toISOString(),
      details,
      questionIndex: this.currentQuestionIndex
    };
    this.incidents.push(incident);
    this.onIncident(incident);
    return incident;
  }

  /**
   * Active toutes les mesures anti-triche
   */
  start() {
    if (!this.enabled || this.isActive) return;
    this.isActive = true;
    this.startTime = new Date().toISOString();
    this.questionStartTimes[this.currentQuestionIndex] = Date.now();

    // 1. Détection de changement de visibilité (sortie d'onglet)
    this._handlers.visibilityChange = () => {
      if (document.visibilityState === 'hidden' && this.isActive) {
        this.tabSwitchCount++;
        const incident = this._recordIncident('tab_switch', 
          `Sortie d'onglet détectée (${this.tabSwitchCount}/${this.maxTabSwitches})`
        );

        if (this.autoSubmitOnMaxSwitches && this.tabSwitchCount >= this.maxTabSwitches) {
          this._recordIncident('auto_submit', 
            `Soumission automatique après ${this.maxTabSwitches} sorties d'onglet`
          );
          this.onAutoSubmit();
        }
      }
    };
    document.addEventListener('visibilitychange', this._handlers.visibilityChange);

    // 2. Détection de perte de focus (changement de fenêtre)
    this._handlers.blur = () => {
      if (this.isActive) {
        this._recordIncident('window_blur', 'Perte de focus de la fenêtre détectée');
      }
    };
    window.addEventListener('blur', this._handlers.blur);

    // 3. Désactivation du copier-coller
    if (this.disableCopyPaste) {
      this._handlers.copy = (e) => {
        if (this.isActive) {
          e.preventDefault();
          this._recordIncident('copy_attempt', 'Tentative de copie bloquée');
        }
      };
      this._handlers.paste = (e) => {
        if (this.isActive) {
          e.preventDefault();
          this._recordIncident('paste_attempt', 'Tentative de collage bloquée');
        }
      };
      this._handlers.cut = (e) => {
        if (this.isActive) {
          e.preventDefault();
          this._recordIncident('cut_attempt', 'Tentative de coupe bloquée');
        }
      };
      document.addEventListener('copy', this._handlers.copy);
      document.addEventListener('paste', this._handlers.paste);
      document.addEventListener('cut', this._handlers.cut);
    }

    // 4. Désactivation du clic droit
    if (this.disableRightClick) {
      this._handlers.contextmenu = (e) => {
        if (this.isActive) {
          e.preventDefault();
          this._recordIncident('right_click', 'Clic droit bloqué');
        }
      };
      document.addEventListener('contextmenu', this._handlers.contextmenu);
    }

    // 5. Détection des raccourcis clavier suspects
    this._handlers.keydown = (e) => {
      if (!this.isActive) return;
      const lowerKey = String(e.key || '').toLowerCase();
      const hasCommandModifier = e.ctrlKey || e.metaKey;

      // Bloquer F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        this._recordIncident('devtools_attempt', 'Tentative d\'ouverture des DevTools (F12)');
      }
      // Bloquer Ctrl/Cmd + Shift + I/J/C (DevTools)
      if (
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(lowerKey))
        || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(lowerKey))
      ) {
        e.preventDefault();
        this._recordIncident('devtools_attempt', 'Tentative d\'ouverture des outils techniques');
      }
      // Bloquer Ctrl/Cmd + U (View Source)
      if (hasCommandModifier && lowerKey === 'u') {
        e.preventDefault();
        this._recordIncident('view_source_attempt', 'Tentative d\'affichage du code source');
      }
      // Détecter Alt+Tab (approximatif)
      if (e.altKey && e.key === 'Tab') {
        this._recordIncident('alt_tab', 'Alt+Tab détecté');
      }
      // Bloquer Ctrl/Cmd + C/V/X
      if (hasCommandModifier && lowerKey === 'c') {
        e.preventDefault();
        this._recordIncident('copy_attempt', 'Tentative de copie clavier bloquée');
      }
      if (hasCommandModifier && lowerKey === 'v') {
        e.preventDefault();
        this._recordIncident('paste_attempt', 'Tentative de collage clavier bloquée');
      }
      if (hasCommandModifier && lowerKey === 'x') {
        e.preventDefault();
        this._recordIncident('cut_attempt', 'Tentative de coupe clavier bloquée');
      }
      // Bloquer Ctrl/Cmd + P (Print)
      if (hasCommandModifier && lowerKey === 'p') {
        e.preventDefault();
        this._recordIncident('print_attempt', 'Tentative d\'impression bloquée');
      }
      // Bloquer Ctrl/Cmd + S
      if (hasCommandModifier && lowerKey === 's') {
        e.preventDefault();
        this._recordIncident('save_page_attempt', 'Tentative de sauvegarde de la page bloquée');
      }
      // Détecter PrintScreen
      if (e.key === 'PrintScreen') {
        this._recordIncident('screenshot_attempt', 'Tentative de capture écran détectée');
      }
    };
    document.addEventListener('keydown', this._handlers.keydown);

    this._handlers.dragstart = (e) => {
      if (!this.isActive) {
        return;
      }

      e.preventDefault();
      this._recordIncident('drag_attempt', 'Tentative de glisser-déposer du contenu bloquée');
    };
    document.addEventListener('dragstart', this._handlers.dragstart);

    // 6. Mode plein écran
    if (this.requireFullscreen) {
      this._handlers.fullscreenChange = () => {
        if (!document.fullscreenElement && this.isActive) {
          this.isFullscreen = false;
          this._recordIncident('fullscreen_exit', 'Sortie du mode plein écran');
          this.onFullscreenExit();
        } else {
          this.isFullscreen = true;
          this._detachFullscreenPromptListeners();
        }
      };
      document.addEventListener('fullscreenchange', this._handlers.fullscreenChange);

      this._handlers.fullscreenPrompt = () => {
        if (!this.isActive || document.fullscreenElement) {
          return;
        }
        this._requestFullscreen();
      };

      // Le plein écran doit être demandé à la suite d'une interaction utilisateur.
      document.addEventListener('pointerdown', this._handlers.fullscreenPrompt, true);
      document.addEventListener('keydown', this._handlers.fullscreenPrompt, true);
      document.addEventListener('touchstart', this._handlers.fullscreenPrompt, true);
    }

    // 7. Détection de redimensionnement suspect
    this._handlers.resize = () => {
      if (this.isActive) {
        const { innerWidth, innerHeight } = window;
        if (innerWidth < 800 || innerHeight < 500) {
          this._recordIncident('window_resize', 
            `Redimensionnement suspect: ${innerWidth}x${innerHeight}`
          );
        }
      }
    };
    window.addEventListener('resize', this._handlers.resize);

    this._handlers.beforeunload = (e) => {
      if (!this.isActive) {
        return undefined;
      }

      this._recordIncident('beforeunload_attempt', 'Tentative de quitter ou recharger la page');
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', this._handlers.beforeunload);

    // 8. Vérification périodique
    this._handlers.checkInterval = setInterval(() => {
      if (document.visibilityState === 'hidden' && this.isActive) {
        // Déjà géré par visibilitychange, mais vérification de sécurité
      }
    }, 3000);
  }

  /**
   * Demande le mode plein écran
   */
  _requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => {
        this.isFullscreen = true;
        this._detachFullscreenPromptListeners();
      }).catch(() => {
        const now = Date.now();
        if (now - this.lastFullscreenDeniedAt > 4000) {
          this.lastFullscreenDeniedAt = now;
          this._recordIncident('fullscreen_denied', 'Mode plein écran refusé par le navigateur');
        }
      });
    }
  }

  _detachFullscreenPromptListeners() {
    if (this._handlers.fullscreenPrompt) {
      document.removeEventListener('pointerdown', this._handlers.fullscreenPrompt, true);
      document.removeEventListener('keydown', this._handlers.fullscreenPrompt, true);
      document.removeEventListener('touchstart', this._handlers.fullscreenPrompt, true);
      delete this._handlers.fullscreenPrompt;
    }
  }

  /**
   * Met à jour l'index de la question courante (pour le tracking des temps)
   */
  setCurrentQuestion(index) {
    // Enregistrer la durée de la question précédente
    if (this.questionStartTimes[this.currentQuestionIndex] !== undefined) {
      const duration = Date.now() - this.questionStartTimes[this.currentQuestionIndex];
      if (!this.questionDurations[this.currentQuestionIndex]) {
        this.questionDurations[this.currentQuestionIndex] = 0;
      }
      this.questionDurations[this.currentQuestionIndex] += duration;
    }

    this.currentQuestionIndex = index;
    this.questionStartTimes[index] = Date.now();
  }

  /**
   * Désactive toutes les mesures et nettoie les listeners
   */
  stop() {
    this.isActive = false;

    // Finaliser la durée de la dernière question
    if (this.questionStartTimes[this.currentQuestionIndex] !== undefined) {
      const duration = Date.now() - this.questionStartTimes[this.currentQuestionIndex];
      if (!this.questionDurations[this.currentQuestionIndex]) {
        this.questionDurations[this.currentQuestionIndex] = 0;
      }
      this.questionDurations[this.currentQuestionIndex] += duration;
    }

    // Supprimer tous les event listeners
    if (this._handlers.visibilityChange) {
      document.removeEventListener('visibilitychange', this._handlers.visibilityChange);
    }
    if (this._handlers.blur) {
      window.removeEventListener('blur', this._handlers.blur);
    }
    if (this._handlers.copy) {
      document.removeEventListener('copy', this._handlers.copy);
    }
    if (this._handlers.paste) {
      document.removeEventListener('paste', this._handlers.paste);
    }
    if (this._handlers.cut) {
      document.removeEventListener('cut', this._handlers.cut);
    }
    if (this._handlers.contextmenu) {
      document.removeEventListener('contextmenu', this._handlers.contextmenu);
    }
    if (this._handlers.keydown) {
      document.removeEventListener('keydown', this._handlers.keydown);
    }
    if (this._handlers.dragstart) {
      document.removeEventListener('dragstart', this._handlers.dragstart);
    }
    if (this._handlers.fullscreenChange) {
      document.removeEventListener('fullscreenchange', this._handlers.fullscreenChange);
    }
    this._detachFullscreenPromptListeners();
    if (this._handlers.resize) {
      window.removeEventListener('resize', this._handlers.resize);
    }
    if (this._handlers.beforeunload) {
      window.removeEventListener('beforeunload', this._handlers.beforeunload);
    }
    if (this._handlers.checkInterval) {
      clearInterval(this._handlers.checkInterval);
    }

    // Quitter le plein écran
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    this._handlers = {};
  }

  /**
   * Génère le rapport d'intégrité complet
   * @param {string} examId - ID de l'examen
   * @param {string} studentId - ID de l'étudiant
   * @returns {IntegrityReport}
   */
  generateIntegrityReport(examId, studentId) {
    // Analyse des temps par question
    const timeAnalysis = {};
    const durations = Object.values(this.questionDurations);
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    Object.entries(this.questionDurations).forEach(([qIdx, duration]) => {
      const isAnomalous = duration < avgDuration * 0.2; // Trop rapide
      timeAnalysis[qIdx] = {
        durationMs: duration,
        durationFormatted: this._formatDuration(duration),
        isAnomalous
      };
    });

    // Calcul du score de risque (0-100)
    let riskScore = 0;
    const tabSwitchRisk = Math.min(this.tabSwitchCount * 15, 45);
    const incidentTypes = [...new Set(this.incidents.map(i => i.type))];
    const diversityRisk = Math.min(incidentTypes.length * 5, 20);
    const anomalousQuestions = Object.values(timeAnalysis).filter(t => t.isAnomalous).length;
    const timeRisk = Math.min(anomalousQuestions * 10, 25);
    const volumeRisk = Math.min(this.incidents.length * 2, 10);

    riskScore = Math.min(tabSwitchRisk + diversityRisk + timeRisk + volumeRisk, 100);

    return {
      examId,
      studentId,
      startedAt: this.startTime,
      completedAt: new Date().toISOString(),
      incidents: [...this.incidents],
      incidentsSummary: {
        total: this.incidents.length,
        tabSwitches: this.tabSwitchCount,
        copyAttempts: this.incidents.filter(i => i.type === 'copy_attempt').length,
        pasteAttempts: this.incidents.filter(i => i.type === 'paste_attempt').length,
        rightClicks: this.incidents.filter(i => i.type === 'right_click').length,
        devtoolsAttempts: this.incidents.filter(i => i.type === 'devtools_attempt').length,
        fullscreenExits: this.incidents.filter(i => i.type === 'fullscreen_exit').length,
        windowBlurs: this.incidents.filter(i => i.type === 'window_blur').length,
      },
      connectionInfo: this.connectionInfo,
      timeAnalysis,
      riskScore,
      riskLevel: riskScore < 20 ? 'low' : riskScore < 50 ? 'medium' : riskScore < 75 ? 'high' : 'critical'
    };
  }

  /**
   * Formate une durée en ms en texte lisible
   */
  _formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}min ${remainingSeconds}s`;
  }

  /**
   * Retourne le nombre de sorties d'onglet
   */
  getTabSwitchCount() {
    return this.tabSwitchCount;
  }

  /**
   * Retourne tous les incidents enregistrés
   */
  getIncidents() {
    return [...this.incidents];
  }

  /**
   * Vérifie si le nombre max de sorties est atteint
   */
  isMaxSwitchesReached() {
    return this.tabSwitchCount >= this.maxTabSwitches;
  }
}

export default AntiCheatService;
