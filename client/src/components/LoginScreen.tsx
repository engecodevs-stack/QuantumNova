import React, { useState, useEffect, useRef } from 'react';
import './LoginScreen.css';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; fullname: string; email: string; role?: 'profe' | 'alumno' }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activePanel, setActivePanel] = useState<'login' | 'register'>('login');
  
  const isTeacherEmail = (email: string) => email.trim().toLowerCase().endsWith('@profe.edu.mx');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register Form State
  const [regFullname, setRegFullname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');

  // Toast Notification State
  const [toastText, setToastText] = useState('');
  const [toastIsError, setToastIsError] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const toastTimeoutRef = useRef<any>(null);

  // Refs for interactive UI
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Load FontAwesome and Remembered Email
  useEffect(() => {
    // Add FontAwesome link if it doesn't exist
    const faId = 'font-awesome-link';
    if (!document.getElementById(faId)) {
      const link = document.createElement('link');
      link.id = faId;
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
      document.head.appendChild(link);
    }

    // Load remembered email
    const remembered = localStorage.getItem('quantum_remember');
    if (remembered) {
      setLoginEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Toast utility
  const showToast = (text: string, isError = false) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastText(text);
    setToastIsError(isError);
    setToastShow(true);

    toastTimeoutRef.current = setTimeout(() => {
      setToastShow(false);
    }, 2600);
  };

  // Canvas Neural Node animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const PARTICLE_COUNT = 78;
    const MAX_DIST = 190;
    let particles: NeuralNode[] = [];

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    class NeuralNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      brightness: number;

      constructor(x: number, y: number, vx: number, vy: number) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 1.5 + Math.random() * 2.6;
        this.brightness = 0.4 + Math.random() * 0.7;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) {
          this.vx *= -0.98;
          this.x = Math.min(Math.max(this.x, 2), width - 2);
        }
        if (this.y < 0 || this.y > height) {
          this.vy *= -0.98;
          this.y = Math.min(Math.max(this.y, 2), height - 2);
        }

        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        const maxSpeed = 1.2;
        if (Math.abs(this.vx) > maxSpeed) this.vx = this.vx > 0 ? maxSpeed : -maxSpeed;
        if (Math.abs(this.vy) > maxSpeed) this.vy = this.vy > 0 ? maxSpeed : -maxSpeed;
      }
    }

    const initNetwork = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const vx = (Math.random() - 0.5) * 0.65;
        const vy = (Math.random() - 0.5) * 0.65;
        particles.push(new NeuralNode(x, y, vx, vy));
      }
    };

    const drawNetwork = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f0f4fc';
      ctx.fillRect(0, 0, width, height);

      // Draw Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < MAX_DIST) {
            const intensity = (1 - dist / MAX_DIST) * 0.55;
            const alpha = Math.min(0.45, intensity * 0.9);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 100, 210, ${alpha * 0.8})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // Draw Nodes
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 110, 230, ${0.4 + p.brightness * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 90, 200, 0.95)`;
        ctx.fill();
      }
    };

    const animate = () => {
      for (const p of particles) p.update();
      drawNetwork();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initNetwork();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Card Tilt Interaction on mouse move
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (mouseY - centerY) / 40;
      const rotateY = (mouseX - centerX) / 40;

      card.style.transition = 'transform 0.18s ease-out';
      card.style.transform = `perspective(1400px) rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg) translateY(-2px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.2)';
    };

    document.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (card) {
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Form input validations
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);
  };

  const handleLoginSubmit = async () => {
    const email = loginEmail.trim();
    const pwd = loginPassword.trim();

    if (!email) { showToast('Ingresa tu correo electrónico', true); return; }
    if (!isValidEmail(email)) { showToast('Formato de correo inválido', true); return; }
    if (!pwd) { showToast('La contraseña es necesaria', true); return; }
    if (pwd.length < 4) { showToast('La contraseña debe tener al menos 4 caracteres', true); return; }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem('quantum_remember', email);
        } else {
          localStorage.removeItem('quantum_remember');
        }

        showToast(`Bienvenido a QUANTUMNOVA, ${data.user.fullname.split(' ')[0]}`);
        // Notify parent application of successful login
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        showToast(data.error || 'Credenciales incorrectas', true);
      }
    } catch (err) {
      console.error(err);
      // Fallback a modo local si el backend no está disponible
      const fallbackUser = {
        id: 'local_' + Date.now(),
        fullname: email.split('@')[0] || 'Estudiante Nova',
        email: email,
        role: isTeacherEmail(email) ? ('profe' as const) : ('alumno' as const)
      };
      showToast(`Modo local: ¡Bienvenido a QuantumNova, ${fallbackUser.fullname}!`);
      setTimeout(() => {
        onLoginSuccess(fallbackUser);
      }, 1000);
    }
  };

  const handleRegisterSubmit = async () => {
    const fullname = regFullname.trim();
    const email = regEmail.trim();
    const pwd = regPassword.trim();
    const confirmPwd = regConfirm.trim();

    setRegErrorMsg('');

    if (!fullname) { setRegErrorMsg('Nombre completo obligatorio'); return; }
    if (fullname.length < 3) { setRegErrorMsg('Mínimo 3 caracteres'); return; }
    if (!email) { setRegErrorMsg('Correo electrónico requerido'); return; }
    if (!isValidEmail(email)) { setRegErrorMsg('Correo inválido'); return; }
    if (!pwd) { setRegErrorMsg('Crea una contraseña segura'); return; }
    if (pwd.length < 6) { setRegErrorMsg('La contraseña debe tener al menos 6 caracteres'); return; }
    if (pwd !== confirmPwd) { setRegErrorMsg('Las contraseñas no coinciden'); return; }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password: pwd })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(`Cuenta QUANTUMNOVA creada, ${fullname.split(' ')[0]}! Inicia sesión.`);
        setLoginEmail(email);
        setLoginPassword('');
        setActivePanel('login');
        
        // Reset registration fields
        setRegFullname('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirm('');
      } else {
        setRegErrorMsg(data.error || 'Error en el registro');
      }
    } catch (err) {
      console.error(err);
      setRegErrorMsg('Error de conexión con el servidor MySQL');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'login' | 'register') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'login') handleLoginSubmit();
      else handleRegisterSubmit();
    }
  };

  const socialMock = (provider: string) => {
    showToast(`Conectando con ${provider}...`, false);
    setTimeout(() => {
      const demoUser = {
        id: 'user_' + provider.toLowerCase() + '_' + Date.now(),
        fullname: `Estudiante ${provider}`,
        email: `estudiante@${provider.toLowerCase()}.com`,
        role: 'alumno' as const
      };
      showToast(`¡Conectado! Bienvenido ${demoUser.fullname}`);
      setTimeout(() => {
        onLoginSuccess(demoUser);
      }, 700);
    }, 900);
  };

  return (
    <div className="login-body">
      <div id="neural-bg">
        <canvas ref={canvasRef} id="neuralCanvas"></canvas>
        <div className="glow-overlay"></div>
      </div>

      <div className="quantum-container">
        <div ref={cardRef} className="liquid-card">
          <div className="logo-area">
            <div className="quantum-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A947E8" />
                    <stop offset="100%" stopColor="#5865F2" />
                  </linearGradient>
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="42" stroke="url(#gradIcon)" strokeWidth="1.5" fill="none" strokeDasharray="6 4" opacity="0.7" />
                <circle cx="50" cy="50" r="36" stroke="url(#gradIcon)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <circle cx="50" cy="50" r="6" fill="#A947E8" filter="url(#neonGlow)" />
                <circle cx="28" cy="35" r="3.5" fill="#5865F2" opacity="0.9" />
                <circle cx="72" cy="35" r="3.5" fill="#5865F2" opacity="0.9" />
                <circle cx="28" cy="65" r="3.5" fill="#5865F2" opacity="0.9" />
                <circle cx="72" cy="65" r="3.5" fill="#5865F2" opacity="0.9" />
                <circle cx="50" cy="20" r="3" fill="#A947E8" opacity="0.8" />
                <circle cx="50" cy="80" r="3" fill="#A947E8" opacity="0.8" />
                <circle cx="20" cy="50" r="3" fill="#A947E8" opacity="0.8" />
                <circle cx="80" cy="50" r="3" fill="#A947E8" opacity="0.8" />
                <line x1="28" y1="35" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1.2" opacity="0.7" />
                <line x1="72" y1="35" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1.2" opacity="0.7" />
                <line x1="28" y1="65" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1.2" opacity="0.7" />
                <line x1="72" y1="65" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1.2" opacity="0.7" />
                <line x1="50" y1="20" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1" opacity="0.6" />
                <line x1="50" y1="80" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1" opacity="0.6" />
                <line x1="20" y1="50" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1" opacity="0.6" />
                <line x1="80" y1="50" x2="50" y2="50" stroke="url(#gradIcon)" strokeWidth="1" opacity="0.6" />
                <line x1="28" y1="35" x2="50" y2="20" stroke="#A947E8" strokeWidth="0.8" opacity="0.5" />
                <line x1="72" y1="35" x2="50" y2="20" stroke="#A947E8" strokeWidth="0.8" opacity="0.5" />
                <line x1="28" y1="65" x2="50" y2="80" stroke="#A947E8" strokeWidth="0.8" opacity="0.5" />
                <line x1="72" y1="65" x2="50" y2="80" stroke="#A947E8" strokeWidth="0.8" opacity="0.5" />
                <circle cx="35" cy="42" r="1.5" fill="#ffffff" opacity="0.9" />
                <circle cx="65" cy="42" r="1.5" fill="#ffffff" opacity="0.9" />
                <circle cx="35" cy="58" r="1.5" fill="#ffffff" opacity="0.9" />
                <circle cx="65" cy="58" r="1.5" fill="#ffffff" opacity="0.9" />
                <circle cx="50" cy="50" r="2" fill="#ffffff" opacity="0.95" />
              </svg>
            </div>
            <h1>QUANTUMNOVA</h1>
            <p>Neural Network • Enge-code</p>
          </div>

          {/* Login Panel */}
          <div className={`form-panel ${activePanel === 'login' ? 'visible-panel' : 'hidden-panel'}`}>
            <div className="input-group">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'login')}
                autoComplete="email"
              />
            </div>
            {loginEmail.includes('@') && (
              <div
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isTeacherEmail(loginEmail) ? 'rgba(138, 43, 226, 0.12)' : 'rgba(0, 122, 255, 0.1)',
                  color: isTeacherEmail(loginEmail) ? '#8a2be2' : '#007aff',
                  border: isTeacherEmail(loginEmail) ? '1px solid rgba(138, 43, 226, 0.3)' : '1px solid rgba(0, 122, 255, 0.25)',
                  fontWeight: 600
                }}
              >
                <i className={isTeacherEmail(loginEmail) ? 'fas fa-chalkboard-teacher' : 'fas fa-user-graduate'}></i>
                {isTeacherEmail(loginEmail)
                  ? 'Rol detectado: Docente / Profe (@profe.edu.mx)'
                  : 'Rol detectado: Alumno / Uso Personal'}
              </div>
            )}
            <div className="input-group">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'login')}
                autoComplete="current-password"
              />
            </div>
            <div className="row-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Recordar acceso</span>
              </label>
              <a
                href="#"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Restablecimiento de contraseña · Enlace enviado a tu correo', false);
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <button className="btn-primary-liquid" onClick={handleLoginSubmit}>
              <i className="fas fa-arrow-right-to-bracket"></i> Iniciar Sesión
            </button>

            <div className="separator">
              <div className="separator-line"></div>
              <span>o continuar con</span>
              <div className="separator-line"></div>
            </div>

            <div className="social-buttons">
              <button className="btn-social btn-google" onClick={() => socialMock('Google')}>
                <i className="fab fa-google"></i> Google
              </button>
              <button className="btn-social btn-facebook" onClick={() => socialMock('Facebook')}>
                <i className="fab fa-facebook-f"></i> Facebook
              </button>
            </div>

            <button
              type="button"
              className="btn-guest-mode"
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#c084fc',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                const guestUser = {
                  id: 'guest_' + Date.now(),
                  fullname: 'Estudiante Invitado',
                  email: 'invitado@quantumnova.ai',
                  role: 'alumno' as const
                };
                showToast('Iniciando sesión como Invitado...');
                setTimeout(() => onLoginSuccess(guestUser), 500);
              }}
            >
              <i className="fas fa-rocket"></i> Explorar en Modo Demo / Invitado
            </button>

            <div className="register-prompt">
              ¿Nuevo en QUANTUMNOVA?
              <button className="link-switch" onClick={() => setActivePanel('register')}>
                Crear cuenta premium
              </button>
            </div>
          </div>

          {/* Register Panel */}
          <div className={`form-panel ${activePanel === 'register' ? 'visible-panel' : 'hidden-panel'}`}>
            <div className="input-group">
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Nombre completo"
                value={regFullname}
                onChange={(e) => setRegFullname(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'register')}
                autoComplete="name"
              />
            </div>
            <div className="input-group">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'register')}
                autoComplete="email"
              />
            </div>
            {regEmail.includes('@') && (
              <div
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isTeacherEmail(regEmail) ? 'rgba(138, 43, 226, 0.12)' : 'rgba(0, 122, 255, 0.1)',
                  color: isTeacherEmail(regEmail) ? '#8a2be2' : '#007aff',
                  border: isTeacherEmail(regEmail) ? '1px solid rgba(138, 43, 226, 0.3)' : '1px solid rgba(0, 122, 255, 0.25)',
                  fontWeight: 600
                }}
              >
                <i className={isTeacherEmail(regEmail) ? 'fas fa-chalkboard-teacher' : 'fas fa-user-graduate'}></i>
                {isTeacherEmail(regEmail)
                  ? 'Registrando como: Docente / Profe (@profe.edu.mx)'
                  : 'Registrando como: Alumno / Uso Personal'}
              </div>
            )}
            <div className="input-group">
              <i className="fas fa-key"></i>
              <input
                type="password"
                placeholder="Contraseña"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'register')}
                autoComplete="new-password"
              />
            </div>
            <div className="input-group">
              <i className="fas fa-check-circle"></i>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'register')}
                autoComplete="off"
              />
            </div>
            {regErrorMsg && <div className="error-msg">{regErrorMsg}</div>}
            
            <button className="btn-primary-liquid" style={{ marginTop: '1rem' }} onClick={handleRegisterSubmit}>
              <i className="fas fa-user-plus"></i> Registrarse
            </button>
            
            <div className="register-prompt">
              ¿Ya tienes cuenta?
              <button className="link-switch" onClick={() => setActivePanel('login')}>
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`quantum-toast-liquid ${toastShow ? 'show' : ''} ${toastIsError ? 'error' : ''}`}
           style={{
             backgroundColor: toastIsError ? 'rgba(255, 245, 245, 0.96)' : 'rgba(255, 255, 255, 0.96)',
             border: toastIsError ? '1px solid #ff3b30' : '1px solid #007affaa',
             color: toastIsError ? '#d70015' : '#1c1c1e'
           }}
      >
        {toastText}
      </div>
    </div>
  );
};
