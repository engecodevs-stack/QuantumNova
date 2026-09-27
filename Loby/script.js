/**
 * QuantumNova - Interactive Client-side Scripting
 * Handles: Horizontal SPA transitions, light liquid glass Login/Register portal,
 * Google & Facebook social authentication simulator, philosophy modal tabs,
 * functional sharing dialogues, Google Play store simulator,
 * and the Interactive Obsidian-style AI Node Graph.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. MOBILE MENU
  // ==========================================================================
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const spans = menuToggle.querySelectorAll('span');
      if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'translateY(8px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }


  // ==========================================================================
  // 2. TOAST NOTIFICATION SYSTEM
  // ==========================================================================
  const toastContainer = document.getElementById('toast-container') || (() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  })();

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg class="toast-success-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    
    // Automatically remove after 3.5 seconds
    setTimeout(() => {
      toast.style.animation = 'toast-in 0.3s ease reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }


  // ==========================================================================
  // 3. HORIZONTAL SPA SLIDER NAVIGATION
  // ==========================================================================
  const sliderWrapper = document.getElementById('slider-wrapper');
  const navLinkHome = document.getElementById('nav-link-home');
  const navLinkWorkspace = document.getElementById('nav-link-workspace');
  const slideToDemoBtns = document.querySelectorAll('.slide-to-demo');
  const slideToHomeBtns = document.querySelectorAll('.slide-to-home');
  const siteLogo = document.getElementById('site-logo');

  function navigateToSlide(slideName) {
    if (slideName === 'workspace') {
      sliderWrapper.classList.add('show-workspace');
      navLinkHome.classList.remove('active');
      navLinkWorkspace.classList.add('active');
    } else {
      sliderWrapper.classList.remove('show-workspace');
      navLinkHome.classList.add('active');
      navLinkWorkspace.classList.remove('active');
    }
    // Close mobile menu if active
    if (navMenu) navMenu.classList.remove('active');
    if (menuToggle) {
      menuToggle.querySelectorAll('span').forEach(s => s.style.transform = 'none');
      menuToggle.querySelectorAll('span')[1].style.opacity = '1';
    }
  }

  // Bind clicks
  if (navLinkHome) {
    navLinkHome.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSlide('home');
    });
  }

  if (siteLogo) {
    siteLogo.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSlide('home');
    });
  }

  if (navLinkWorkspace) {
    navLinkWorkspace.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSlide('workspace');
    });
  }

  slideToDemoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = localStorage.getItem('quantum_user');
      if (user) {
        window.location.href = '/app/';
      } else {
        navigateToSlide('workspace');
      }
    });
  });

  slideToHomeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSlide('home');
    });
  });


  // ==========================================================================
  // 4. PHILOSOPHY MODAL CONTROLLER (MISIÓN, VISIÓN, VALORES)
  // ==========================================================================
  const philosophyModal = document.getElementById('philosophy-modal');
  const navLinkPhilosophy = document.getElementById('nav-link-philosophy');
  const closePhilosophy = document.getElementById('close-philosophy');
  const philosophyTabBtns = document.querySelectorAll('.philosophy-tab-btn');
  const philosophyPanels = document.querySelectorAll('.philosophy-panel');

  if (navLinkPhilosophy) {
    navLinkPhilosophy.addEventListener('click', (e) => {
      e.preventDefault();
      philosophyModal.classList.add('active');
      if (navMenu) navMenu.classList.remove('active');
    });
  }

  if (closePhilosophy) {
    closePhilosophy.addEventListener('click', () => {
      philosophyModal.classList.remove('active');
    });
  }

  philosophyTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;

      // Toggle active states
      philosophyTabBtns.forEach(b => b.classList.remove('active'));
      philosophyPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });


  // ==========================================================================
  // 5. LIGHT GLASS AUTH PORTAL (LOGIN & REGISTRO WITH DYNAMIC BUTTON TEXT)
  // ==========================================================================
  const loginModal = document.getElementById('login-modal');
  const openLoginBtns = document.querySelectorAll('.open-login');
  const closeLoginBtn = document.getElementById('close-login');
  
  // Auth Form view elements
  const loginFormView = document.getElementById('login-form-view');
  const registerFormView = document.getElementById('register-form-view');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  
  const toggleToRegister = document.getElementById('toggle-to-register');
  const toggleToLogin = document.getElementById('toggle-to-login');
  
  // Forms
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Social Auth Buttons
  const googleLoginBtn = document.getElementById('google-login-btn');
  const facebookLoginBtn = document.getElementById('facebook-login-btn');
  const googleRegisterBtn = document.getElementById('google-register-btn');
  const facebookRegisterBtn = document.getElementById('facebook-register-btn');
  
  // Nav Profile Elements
  const loginNavBtn = document.getElementById('login-nav-btn');
  const userProfileDiv = document.getElementById('user-profile');
  const userProfileName = document.getElementById('user-profile-name');
  const logoutBtn = document.getElementById('logout-btn');

  // Open Modal
  openLoginBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.classList.add('active');
    });
  });

  // Close Modal
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', () => {
      loginModal.classList.remove('active');
    });
  }

  // Switch to Login View
  function showLoginView() {
    loginFormView.classList.remove('hidden');
    registerFormView.classList.add('hidden');
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
  }

  // Switch to Register View
  function showRegisterView() {
    loginFormView.classList.add('hidden');
    registerFormView.classList.remove('hidden');
    tabLoginBtn.classList.remove('active');
    tabRegisterBtn.classList.add('active');
  }

  // Bind Switchers
  if (tabLoginBtn) tabLoginBtn.addEventListener('click', showLoginView);
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', showRegisterView);
  if (toggleToRegister) toggleToRegister.addEventListener('click', showRegisterView);
  if (toggleToLogin) toggleToLogin.addEventListener('click', showLoginView);

  // Hero Entrar a la App button: if logged in, go to /app/, otherwise open login modal
  const heroEntrarBtn = document.getElementById('hero-entrar-app-btn');
  if (heroEntrarBtn) {
    heroEntrarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = localStorage.getItem('quantum_user') || localStorage.getItem('qn_user');
      if (user) {
        window.location.href = '/app/';
      } else {
        if (loginModal) loginModal.classList.add('active');
      }
    });
  }

  // Submit Login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Verificando...';
      submitBtn.disabled = true;

      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(res => res.json())
      .then(data => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;

        if (data.success) {
          localStorage.setItem('quantum_user', JSON.stringify(data.user));
          localStorage.setItem('qn_user', JSON.stringify({ name: data.user.fullname, email: data.user.email }));
          updateUserUI();
          loginForm.reset();
          loginModal.classList.remove('active');
          showToast(`¡Sesión iniciada! Bienvenido, ${data.user.fullname}. Redirigiendo...`);
          setTimeout(() => {
            window.location.href = '/app/';
          }, 700);
        } else if (data.dbConnected === false) {
          // Si la base de datos remota aún no está conectada, entrar en modo local
          const isProfe = email.toLowerCase().endsWith('@profe.edu.mx');
          const fallbackUser = {
            id: 'local_' + Date.now(),
            fullname: email.split('@')[0] || 'Estudiante Nova',
            email: email,
            role: isProfe ? 'profe' : 'alumno'
          };
          localStorage.setItem('quantum_user', JSON.stringify(fallbackUser));
          localStorage.setItem('qn_user', JSON.stringify({ name: fallbackUser.fullname, email: fallbackUser.email }));
          updateUserUI();
          loginModal.classList.remove('active');
          showToast('Modo local activado. Redirigiendo a tu espacio...');
          setTimeout(() => {
            window.location.href = '/app/';
          }, 700);
        } else {
          alert(data.error || 'Credenciales incorrectas');
        }
      })
      .catch(err => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        console.warn('Backend o base de datos no disponible, activando modo local:', err);
        const isProfe = email.toLowerCase().endsWith('@profe.edu.mx');
        const fallbackUser = {
          id: 'local_' + Date.now(),
          fullname: email.split('@')[0] || 'Estudiante Nova',
          email: email,
          role: isProfe ? 'profe' : 'alumno'
        };
        localStorage.setItem('quantum_user', JSON.stringify(fallbackUser));
        localStorage.setItem('qn_user', JSON.stringify({ name: fallbackUser.fullname, email: fallbackUser.email }));
        updateUserUI();
        loginModal.classList.remove('active');
        showToast(`¡Modo local activado! Bienvenido, ${fallbackUser.fullname}. Redirigiendo...`);
        setTimeout(() => {
          window.location.href = '/app/';
        }, 700);
      });
    });
  }

  // Submit Registration
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const passwordConfirm = document.getElementById('reg-password-confirm').value;

      if (password !== passwordConfirm) {
        alert('Las contraseñas no coinciden. Por favor verifícalas.');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Creando cuenta...';
      submitBtn.disabled = true;

      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname: name, email, password })
      })
      .then(res => res.json())
      .then(data => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;

        if (data.success) {
          localStorage.setItem('quantum_user', JSON.stringify(data.user));
          localStorage.setItem('qn_user', JSON.stringify({ name: data.user.fullname, email: data.user.email }));
          updateUserUI();
          registerForm.reset();
          loginModal.classList.remove('active');
          showToast(`¡Cuenta registrada! Bienvenido, ${data.user.fullname}. Redirigiendo...`);
          setTimeout(() => {
            window.location.href = '/app/';
          }, 700);
        } else if (data.dbConnected === false) {
          const isProfe = email.toLowerCase().endsWith('@profe.edu.mx');
          const fallbackUser = {
            id: 'local_' + Date.now(),
            fullname: name || 'Estudiante Nova',
            email: email,
            role: isProfe ? 'profe' : 'alumno'
          };
          localStorage.setItem('quantum_user', JSON.stringify(fallbackUser));
          localStorage.setItem('qn_user', JSON.stringify({ name: fallbackUser.fullname, email: fallbackUser.email }));
          updateUserUI();
          registerForm.reset();
          loginModal.classList.remove('active');
          showToast(`¡Cuenta local creada! Bienvenido, ${fallbackUser.fullname}. Redirigiendo...`);
          setTimeout(() => {
            window.location.href = '/app/';
          }, 700);
        } else {
          alert(data.error || 'Error en el registro');
        }
      })
      .catch(err => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        console.warn('Backend o base de datos no disponible, activando cuenta local:', err);
        const isProfe = email.toLowerCase().endsWith('@profe.edu.mx');
        const fallbackUser = {
          id: 'local_' + Date.now(),
          fullname: name || 'Estudiante Nova',
          email: email,
          role: isProfe ? 'profe' : 'alumno'
        };
        localStorage.setItem('quantum_user', JSON.stringify(fallbackUser));
        localStorage.setItem('qn_user', JSON.stringify({ name: fallbackUser.fullname, email: fallbackUser.email }));
        updateUserUI();
        registerForm.reset();
        loginModal.classList.remove('active');
        showToast(`¡Cuenta local creada! Bienvenido, ${fallbackUser.fullname}. Redirigiendo...`);
        setTimeout(() => {
          window.location.href = '/app/';
        }, 700);
      });
    });
  }

  // Hook Guest Mode buttons in Lobby
  document.querySelectorAll('.lobby-guest-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const guestUser = {
        id: 'guest_' + Date.now(),
        fullname: 'Estudiante Invitado',
        email: 'invitado@quantumnova.ai',
        role: 'alumno'
      };
      localStorage.setItem('qn_user', JSON.stringify({ name: guestUser.fullname, email: guestUser.email }));
      localStorage.setItem('quantum_user', JSON.stringify(guestUser));
      updateUserUI();
      loginModal.classList.remove('active');
      showToast('¡Iniciando en Modo Demo / Invitado! Redirigiendo a tu espacio...');
      setTimeout(() => {
        window.location.href = '/app/';
      }, 600);
    });
  });

  // Simulate Google / Facebook OAuth Integration
  function simulateSocialAuth(platform, placeholderName) {
    showToast(`Conectando con tu cuenta de ${platform}...`);
    
    setTimeout(() => {
      const name = placeholderName;
      const email = `${name.toLowerCase().replace(/\s+/g, '')}@${platform.toLowerCase()}.com`;
      const socialUser = {
        id: 'user_' + platform.toLowerCase() + '_' + Date.now(),
        fullname: name,
        email: email,
        role: 'alumno'
      };
      
      localStorage.setItem('qn_user', JSON.stringify({ name, email }));
      localStorage.setItem('quantum_user', JSON.stringify(socialUser));
      updateUserUI();
      
      loginModal.classList.remove('active');
      showToast(`¡Acceso verificado vía ${platform}! Bienvenido, ${name}. Redirigiendo...`);
      setTimeout(() => {
        window.location.href = '/app/';
      }, 700);
    }, 900);
  }

  // Hook social login clicks
  if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => simulateSocialAuth('Google', 'Carlos Mendoza'));
  if (facebookLoginBtn) facebookLoginBtn.addEventListener('click', () => simulateSocialAuth('Facebook', 'Sofía Rivas'));
  if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', () => simulateSocialAuth('Google', 'Carlos Mendoza'));
  if (facebookRegisterBtn) facebookRegisterBtn.addEventListener('click', () => simulateSocialAuth('Facebook', 'Sofía Rivas'));

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('qn_user');
      localStorage.removeItem('quantum_user');
      updateUserUI();
      showToast('Sesión cerrada con éxito.');
    });
  }

  // Check user state & update elements (now supports changing 'Probar Demo Gratis' button texts to 'Empezar')
  function updateUserUI() {
    let user = JSON.parse(localStorage.getItem('qn_user'));
    const quantumUser = JSON.parse(localStorage.getItem('quantum_user'));
    if (!user && quantumUser) {
      user = { name: quantumUser.fullname, email: quantumUser.email };
      localStorage.setItem('qn_user', JSON.stringify(user));
    }
    const demoBtns = document.querySelectorAll('.slide-to-demo');

    if (user) {
      if (loginNavBtn) loginNavBtn.classList.add('hidden');
      if (userProfileDiv) {
        userProfileDiv.classList.remove('hidden');
        userProfileName.innerText = user.name;
        const charAvatar = document.getElementById('user-avatar-char');
        if (charAvatar) charAvatar.innerText = user.name.charAt(0).toUpperCase();
      }

      // Update demo buttons to say 'Empezar' when logged in
      demoBtns.forEach(btn => {
        const label = btn.querySelector('.btn-demo-label');
        if (label) {
          label.textContent = 'Empezar';
        } else if (btn.tagName === 'BUTTON') {
          btn.textContent = 'Empezar';
        }
      });
    } else {
      if (loginNavBtn) loginNavBtn.classList.remove('hidden');
      if (userProfileDiv) userProfileDiv.classList.add('hidden');

      // Revert demo buttons back to 'Probar Demo Gratis' when logged out
      demoBtns.forEach(btn => {
        const label = btn.querySelector('.btn-demo-label');
        if (label) {
          label.textContent = 'Probar Demo Gratis';
        } else if (btn.tagName === 'BUTTON') {
          btn.textContent = 'Probar Demo Gratis';
        }
      });
    }
  }

  updateUserUI();


  // ==========================================================================
  // 6. FUNCTIONAL SOCIAL SHARING MODAL
  // ==========================================================================
  const shareModal = document.getElementById('share-modal');
  const closeShare = document.getElementById('close-share');
  const shareLinkInput = document.getElementById('share-link-input');
  const btnCopyShare = document.getElementById('btn-copy-share');
  const shareModalDesc = document.getElementById('share-modal-description');
  const shareIconLargeFb = document.getElementById('share-social-fb');
  const shareIconLargeTw = document.getElementById('share-social-tw');

  document.querySelectorAll('.trigger-share').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.dataset.platform;
      shareModalDesc.innerText = `¡Comparte el mapa conceptual de QuantumNova en ${platform}!`;
      shareLinkInput.value = `https://quantumnova.ai/invite?ref=stud_shared&platform=${platform.toLowerCase()}`;
      shareModal.classList.add('active');
    });
  });

  if (closeShare) {
    closeShare.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });
  }

  if (btnCopyShare) {
    btnCopyShare.addEventListener('click', () => {
      navigator.clipboard.writeText(shareLinkInput.value)
        .then(() => {
          showToast('¡Enlace de invitación copiado al portapapeles!');
          shareModal.classList.remove('active');
        })
        .catch(err => {
          console.error('Error al copiar: ', err);
          alert('No se pudo copiar de manera automática, por favor cópialo manualmente.');
        });
    });
  }

  if (shareIconLargeFb) {
    shareIconLargeFb.addEventListener('click', () => {
      showToast('Redireccionando para compartir en Facebook...');
      setTimeout(() => shareModal.classList.remove('active'), 500);
    });
  }

  if (shareIconLargeTw) {
    shareIconLargeTw.addEventListener('click', () => {
      showToast('Redireccionando para compartir en Twitter/X...');
      setTimeout(() => shareModal.classList.remove('active'), 500);
    });
  }


  // ==========================================================================
  // 7. GOOGLE PLAY STORE DOWNLOAD SIMULATOR
  // ==========================================================================
  const playstoreModal = document.getElementById('playstore-modal');
  const openPlayStoreBtns = document.querySelectorAll('.open-playstore');
  const closePlaystoreBtn = document.getElementById('close-playstore');
  
  const btnInstall = document.getElementById('btn-install');
  const downloadProgressContainer = document.getElementById('download-progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressPercentText = document.getElementById('progress-percent-text');
  const installedActions = document.getElementById('installed-actions');
  const btnUninstall = document.getElementById('btn-uninstall');
  const btnOpen = document.getElementById('btn-open');

  let downloadInterval = null;

  openPlayStoreBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      playstoreModal.classList.add('active');
      checkLocalAppStatus();
    });
  });

  if (closePlaystoreBtn) {
    closePlaystoreBtn.addEventListener('click', () => {
      playstoreModal.classList.remove('active');
      clearInterval(downloadInterval);
    });
  }

  function checkLocalAppStatus() {
    const appState = localStorage.getItem('qn_app_installed');
    if (appState === 'true') {
      btnInstall.style.display = 'none';
      downloadProgressContainer.style.display = 'none';
      installedActions.style.display = 'flex';
    } else {
      btnInstall.style.display = 'flex';
      downloadProgressContainer.style.display = 'none';
      installedActions.style.display = 'none';
    }
  }

  if (btnInstall) {
    btnInstall.addEventListener('click', () => {
      btnInstall.style.display = 'none';
      downloadProgressContainer.style.display = 'flex';
      progressBar.style.width = '0%';
      progressPercentText.innerText = '0%';
      
      let progress = 0;
      clearInterval(downloadInterval);
      
      downloadInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress >= 100) {
          progress = 100;
          clearInterval(downloadInterval);
          
          localStorage.setItem('qn_app_installed', 'true');
          setTimeout(() => {
            showToast('¡QuantumNova se ha instalado correctamente!');
            checkLocalAppStatus();
          }, 300);
        }
        progressBar.style.width = `${progress}%`;
        progressPercentText.innerText = `${progress}%`;
      }, 150);
    });
  }

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      playstoreModal.classList.remove('active');
      showToast('Iniciando aplicación QuantumNova...');
      navigateToSlide('workspace');
    });
  }

  if (btnUninstall) {
    btnUninstall.addEventListener('click', () => {
      localStorage.removeItem('qn_app_installed');
      checkLocalAppStatus();
      showToast('Aplicación desinstalada.');
    });
  }


  // ==========================================================================
  // 8. AI INTERACTIVE NODE GRAPH (OBSIDIAN-STYLE SVG WORKSPACE)
  // ==========================================================================
  const svg = document.getElementById('concept-map-svg');
  const generateBtn = document.getElementById('btn-generate-map');
  const topicInput = document.getElementById('topic-input');
  const graphLoader = document.getElementById('graph-loader');
  const graphLoaderText = document.getElementById('graph-loader-text');
  
  const nodeTooltip = document.getElementById('node-tooltip');
  const nodeTooltipTitle = document.getElementById('node-tooltip-title');
  const nodeTooltipDesc = document.getElementById('node-tooltip-desc');
  const nodeTooltipClose = document.getElementById('node-tooltip-close');

  const suggestionChips = document.querySelectorAll('.suggestion-chip');

  const conceptDatabase = {
    "inteligencia artificial": {
      center: "Inteligencia Artificial",
      centerDesc: "Campo de la informática dedicado a la creación de sistemas capaces de realizar tareas que requieren inteligencia humana.",
      nodes: [
        { label: "Redes Neuronales", desc: "Modelos computacionales inspirados en la estructura neuronal humana para aprender patrones." },
        { label: "Machine Learning", desc: "Subcampo que permite a las computadoras aprender y mejorar sin ser programadas explícitamente." },
        { label: "Deep Learning", desc: "Redes neuronales profundas de múltiples capas ideales para visión por computadora y procesamiento del lenguaje." },
        { label: "NLP (Procesamiento Lenguaje)", desc: "Rama que ayuda a las máquinas a leer, descifrar y comprender los lenguajes humanos." },
        { label: "Robótica Cognitiva", desc: "Rama que otorga capacidades de aprendizaje y toma de decisiones a sistemas robóticos autónomos." }
      ]
    },
    "cerebro humano": {
      center: "Cerebro Humano",
      centerDesc: "Órgano central del sistema nervioso humano. Controla la mayoría de las actividades del cuerpo e interpreta la información.",
      nodes: [
        { label: "Corteza Cerebral", desc: "Capa externa de tejido neuronal plegado encargada de la percepción, memoria y decisiones." },
        { label: "Neuronas", desc: "Células especializadas del sistema nervioso que transmiten señales eléctricas y químicas." },
        { label: "Sinapsis", desc: "Uniones microscópicas a través de las cuales las neuronas se comunican químicamente." },
        { label: "Plasticidad Neuronal", desc: "Capacidad del cerebro para adaptarse, reorganizarse y formar nuevas conexiones a lo largo de la vida." },
        { label: "Neurotransmisores", desc: "Mensajeros químicos (como dopamina o serotonina) que cruzan las sinapsis cerebrales." }
      ]
    },
    "desarrollo web": {
      center: "Desarrollo Web",
      centerDesc: "Creación, diseño y mantenimiento de sitios y aplicaciones web que corren en navegadores de internet.",
      nodes: [
        { label: "HTML5 & CSS3", desc: "Estructura semántica básica y capas de diseño/estilo visual de la web." },
        { label: "JavaScript Vanilla", desc: "Lenguaje de programación fundamental del lado del cliente para interactividad dinámica." },
        { label: "APIs & Fetch", desc: "Mecanismo de comunicación que permite a las páginas web solicitar datos a servidores en segundo plano." },
        { label: "Frontend Frameworks", desc: "Librerías estructurales modernas como React, Vue o Svelte para aplicaciones escalables." },
        { label: "Bases de Datos", desc: "Sistemas de almacenamiento persistente como SQL o MongoDB para información del usuario." }
      ]
    },
    "obsidian": {
      center: "Obsidian",
      centerDesc: "Poderosa aplicación de toma de notas y base de conocimiento local que funciona sobre archivos Markdown.",
      nodes: [
        { label: "Markdown", desc: "Lenguaje de marcado ligero para formatear texto plano de forma simple y portátil." },
        { label: "Enlaces Bidireccionales", desc: "Habilidad para conectar notas en ambas direcciones, imitando las sinapsis del pensamiento." },
        { label: "Bóveda Local (Vault)", desc: "Estructura de archivos local que almacena tus notas en tu propio disco duro, garantizando privacidad." },
        { label: "Vista de Gráfico", desc: "Representación interactiva tridimensional de los enlaces entre todas tus notas." },
        { label: "Plugins de la Comunidad", desc: "Extensiones para añadir calendarios, tableros Kanban, bases de datos y más." }
      ]
    }
  };

  let currentNodes = [];
  let currentLinks = [];
  let draggedNodeIndex = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  function resizeCanvas() {
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  }
  
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 200);

  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topicInput.value = chip.dataset.topic;
      triggerGraphGeneration(chip.dataset.topic);
    });
  });

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const topic = topicInput.value.trim();
      if (!topic) {
        alert('Por favor introduce un tema para que la IA genere el mapa.');
        return;
      }
      triggerGraphGeneration(topic);
    });
  }

  if (nodeTooltipClose) {
    nodeTooltipClose.addEventListener('click', () => {
      nodeTooltip.style.display = 'none';
    });
  }

  function triggerGraphGeneration(topic) {
    nodeTooltip.style.display = 'none';
    graphLoader.classList.add('active');
    
    const steps = [
      "La IA está escaneando conceptos...",
      "Extrayendo jerarquías de nodos clave...",
      "Diseñando enlaces conceptuales...",
      "Trazando gráfico interactivo..."
    ];
    
    let stepIndex = 0;
    graphLoaderText.innerText = steps[0];
    
    const textInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        graphLoaderText.innerText = steps[stepIndex];
      }
    }, 450);

    setTimeout(() => {
      clearInterval(textInterval);
      graphLoader.classList.remove('active');
      generateConceptMapData(topic);
    }, 1800);
  }

  function generateConceptMapData(topic) {
    const cleanTopic = topic.toLowerCase().trim();
    let data = conceptDatabase[cleanTopic];

    if (!data) {
      data = {
        center: topic,
        centerDesc: `Concepto central sobre ${topic}. Generado dinámicamente por la IA de QuantumNova para facilitar tu estudio estructurado.`,
        nodes: [
          { label: `Fundamentos de ${topic}`, desc: `Bases principales y prerrequisitos necesarios para comprender integralmente el tema de ${topic}.` },
          { label: `Aplicaciones Prácticas`, desc: `Cómo se implementa o utiliza ${topic} en el mundo real, la industria o la investigación.` },
          { label: `Conceptos Clave`, desc: `Terminología esencial y glosario de términos necesarios para dominar ${topic}.` },
          { label: `Metodologías`, desc: `Estrategias comunes, metodologías y procesos vinculados a la optimización de ${topic}.` },
          { label: `Preguntas de Examen`, desc: `Preguntas guía recomendadas por la IA para repasar y autoevaluar tu conocimiento sobre ${topic}.` }
        ]
      };
    }

    const rect = svg.getBoundingClientRect();
    const centerX = rect.width > 0 ? rect.width / 2 : 400;
    const centerY = rect.height > 0 ? rect.height / 2 : 240;
    
    svg.innerHTML = '';
    currentNodes = [];
    currentLinks = [];

    // Center Node
    currentNodes.push({
      x: centerX,
      y: centerY,
      r: 28,
      label: data.center,
      desc: data.centerDesc,
      type: 'center',
      color: 'url(#grad-center)'
    });

    // Satellites
    const numSatellites = data.nodes.length;
    const radius = 140;
    
    for (let i = 0; i < numSatellites; i++) {
      const angle = (i * 2 * Math.PI) / numSatellites;
      const nodeX = centerX + radius * Math.cos(angle);
      const nodeY = centerY + radius * Math.sin(angle);
      
      currentNodes.push({
        x: nodeX,
        y: nodeY,
        r: 20,
        label: data.nodes[i].label,
        desc: data.nodes[i].desc,
        type: 'satellite',
        color: `url(#grad-sat-${i % 3})`
      });

      currentLinks.push({
        source: 0,
        target: i + 1
      });
    }

    renderGraph();
  }

  function renderGraph() {
    svg.innerHTML = '';

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <radialGradient id="grad-center" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#818cf8"/>
        <stop offset="100%" stop-color="#4f46e5"/>
      </radialGradient>
      <radialGradient id="grad-sat-0" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#22d3ee"/>
        <stop offset="100%" stop-color="#0891b2"/>
      </radialGradient>
      <radialGradient id="grad-sat-1" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#c084fc"/>
        <stop offset="100%" stop-color="#9333ea"/>
      </radialGradient>
      <radialGradient id="grad-sat-2" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#60a5fa"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </radialGradient>
    `;
    svg.appendChild(defs);

    // Links
    currentLinks.forEach((link, idx) => {
      const sourceNode = currentNodes[link.source];
      const targetNode = currentNodes[link.target];

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute('x1', sourceNode.x);
      line.setAttribute('y1', sourceNode.y);
      line.setAttribute('x2', targetNode.x);
      line.setAttribute('y2', targetNode.y);
      line.setAttribute('class', 'link-line');
      line.setAttribute('id', `link-${idx}`);
      svg.appendChild(line);
    });

    // Nodes
    currentNodes.forEach((node, idx) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute('class', 'node-group');
      g.setAttribute('data-index', idx);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', node.r);
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', 'rgba(255,255,255,0.7)');
      circle.setAttribute('stroke-width', '2px');
      circle.setAttribute('class', 'node-circle');
      g.appendChild(circle);

      const textWidthMock = node.label.length * 7;
      const rectBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectBg.setAttribute('x', node.x - (textWidthMock / 2) - 6);
      rectBg.setAttribute('y', node.y + node.r + 6);
      rectBg.setAttribute('width', textWidthMock + 12);
      rectBg.setAttribute('height', 18);
      rectBg.setAttribute('class', 'node-label-bg');
      g.appendChild(rectBg);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + node.r + 19);
      text.setAttribute('class', 'node-label');
      text.textContent = node.label;
      g.appendChild(text);

      g.addEventListener('click', (e) => {
        if (isDragging) return;
        e.stopPropagation();
        nodeTooltipTitle.innerText = node.label;
        nodeTooltipDesc.innerText = node.desc;
        nodeTooltip.style.display = 'block';
      });

      g.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        draggedNodeIndex = idx;
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        dragOffset.x = mouseX - node.x;
        dragOffset.y = mouseY - node.y;
        isDragging = false;
      });

      g.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        draggedNodeIndex = idx;
        const rect = svg.getBoundingClientRect();
        const touch = e.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        dragOffset.x = mouseX - node.x;
        dragOffset.y = mouseY - node.y;
        isDragging = false;
      });

      svg.appendChild(g);
    });
  }

  function onDragMove(clientX, clientY) {
    if (draggedNodeIndex === null) return;
    
    isDragging = true;
    const rect = svg.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    const node = currentNodes[draggedNodeIndex];
    node.x = mouseX - dragOffset.x;
    node.y = mouseY - dragOffset.y;

    node.x = Math.max(30, Math.min(rect.width - 30, node.x));
    node.y = Math.max(30, Math.min(rect.height - 30, node.y));

    const gElement = svg.querySelector(`.node-group[data-index="${draggedNodeIndex}"]`);
    if (gElement) {
      const circle = gElement.querySelector('circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      
      const text = gElement.querySelector('text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + node.r + 19);

      const rectBg = gElement.querySelector('rect');
      const textWidthMock = node.label.length * 7;
      rectBg.setAttribute('x', node.x - (textWidthMock / 2) - 6);
      rectBg.setAttribute('y', node.y + node.r + 6);
    }

    currentLinks.forEach((link, idx) => {
      if (link.source === draggedNodeIndex || link.target === draggedNodeIndex) {
        const line = document.getElementById(`link-${idx}`);
        if (line) {
          const sourceNode = currentNodes[link.source];
          const targetNode = currentNodes[link.target];
          line.setAttribute('x1', sourceNode.x);
          line.setAttribute('y1', sourceNode.y);
          line.setAttribute('x2', targetNode.x);
          line.setAttribute('y2', targetNode.y);
        }
      }
    });
  }

  svg.addEventListener('mousemove', (e) => {
    if (draggedNodeIndex !== null) {
      onDragMove(e.clientX, e.clientY);
    }
  });

  svg.addEventListener('touchmove', (e) => {
    if (draggedNodeIndex !== null) {
      const touch = e.touches[0];
      onDragMove(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  });

  function endDrag() {
    draggedNodeIndex = null;
    setTimeout(() => {
      isDragging = false;
    }, 50);
  }

  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

  // Load Initial Graph
  setTimeout(() => {
    generateConceptMapData("inteligencia artificial");
  }, 300);

});
