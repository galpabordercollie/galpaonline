/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="vite/client" />

import React, { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  ChevronRight, 
  LogOut, 
  Play, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  ChevronDown,
  Info,
  Users,
  Award,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---

interface ClassItem {
  id?: number; // Row index from spreadsheet
  fecha: string;
  titulo: string;
  videoUrl: string;
  notas: string;
  notasAlumno: string;
  tipo: string;
}

interface AlumnoData {
  success: boolean;
  user: string;
  classes: ClassItem[];
  message?: string;
}

type ViewState = "landing" | "login" | "dashboard";

// --- Constants ---

const LOGIN_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyB27KkQ4T5_Y9u-1pJxd7vrFxsBxz68QBEswYiaygkFoDuOxIgAyAYfjuTBdxF8asDug/exec";
const DATA_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNCBM7RpjnNCoDCl9M9Gyrg9pg9z3Oq8S0e0ixxH-wafhpyhtXF876lR_U2G-qF3FAOg/exec";

// --- Utils ---

const formatDate = (dateString: string) => {
  if (!dateString) return "--/--/--";
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

// --- Components ---

export default function App() {
  const [view, setView] = useState<ViewState>("landing");
  const [user, setUser] = useState<AlumnoData | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const savedData = sessionStorage.getItem("alumnoData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUser(parsed);
        setView("dashboard");
      } catch (e) {
        sessionStorage.removeItem("alumnoData");
      }
    }
  }, []);

  const handleLoginSuccess = (data: AlumnoData) => {
    setUser(data);
    sessionStorage.setItem("alumnoData", JSON.stringify(data));
    setView("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("alumnoData");
    setUser(null);
    setView("landing");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-12 h-20 flex justify-between items-center">
            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => setView("landing")}
            >
              <div className="h-16 w-auto flex items-center justify-center">
                <img 
                  src={`${import.meta.env.BASE_URL}Logo.png`}
                  alt="GALPA Logo" 
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    // Fallback to the icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.classList.add('fallback-active');
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="hidden [.fallback-active_&]:flex w-8 h-8 bg-brand-accent rounded-sm rotate-45 items-center justify-center transition-transform group-hover:rotate-[225deg] duration-500">
                  <div className="w-3 h-3 border border-brand-bg rotate-45"></div>
                </div>
              </div>
              <span className="text-xs tracking-[0.3em] font-bold uppercase transition-colors group-hover:text-brand-accent">Galpa Sheepdog Campus</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              {view === "landing" && (
                <>
                  <a href="#about" className="text-[10px] uppercase tracking-widest font-medium opacity-60 hover:opacity-100 transition-opacity">Metodología</a>
                  <a href="#features" className="text-[10px] uppercase tracking-widest font-medium opacity-60 hover:opacity-100 transition-opacity">Recursos</a>
                  <button 
                    onClick={() => setView("login")}
                    className="text-[10px] uppercase tracking-widest font-bold text-brand-accent border border-brand-accent/30 px-6 py-2 rounded transition-all hover:bg-brand-accent hover:text-brand-bg shadow-lg shadow-brand-accent/5"
                  >
                    Acceso Alumnos
                  </button>
                </>
              )}
              {view === "dashboard" && (
                <div className="flex items-center gap-6">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Usuario Registrado</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">{user?.user}</span>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-rose-500/60 hover:text-rose-500 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
              {view === "login" && (
                 <button 
                  onClick={() => setView("landing")}
                  className="text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity"
                >
                  Volver al Inicio
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="p-2 text-brand-accent"
              >
                {isNavOpen ? <X /> : <Menu />}
              </button>
            </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-brand-surface border-b border-white/5 overflow-hidden"
            >
              <div className="px-12 pt-4 pb-8 space-y-6">
                <button 
                  onClick={() => { setView("landing"); setIsNavOpen(false); }}
                  className="block w-full text-left text-[10px] uppercase tracking-widest font-medium opacity-60"
                >
                  Inicio
                </button>
                <button 
                  onClick={() => { setView("login"); setIsNavOpen(false); }}
                  className="block w-full text-center bg-brand-accent text-brand-bg py-4 rounded-lg text-xs uppercase tracking-widest font-bold"
                >
                  Acceso Alumnos
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        {view === "landing" && (
            <>
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-20 -right-20 w-[400px] h-[400px] bg-brand-forest/20 rounded-full blur-[100px] pointer-events-none"></div>
            </>
        )}

        <AnimatePresence mode="wait">
          {view === "landing" && <LandingView onStart={() => setView("login")} />}
          {view === "login" && (
            <LoginView 
              onSuccess={handleLoginSuccess} 
              onBack={() => setView("landing")} 
            />
          )}
          {view === "dashboard" && user && (
            <DashboardView user={user} onLogout={handleLogout} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-12 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] uppercase tracking-[0.3em] font-medium text-brand-ink/30">
        <div className="flex gap-8">
          <span>GALPA © 2026 <span className="ml-2 font-mono opacity-40">v 0.0.2</span></span>
          <span className="text-white/5 hidden md:block">|</span>
          <span>Sheepdog Specialization Campus</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse shadow-[0_0_8px_var(--color-brand-accent)]"></span>
          <span>Servidor Campus Activo</span>
        </div>
      </footer>
    </div>
  );
}

// --- View: Landing ---

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-12 py-10 gap-20 relative z-10"
    >
      <div className="flex flex-col md:flex-row gap-20 flex-1">
        {/* Left Side: Content */}
        <div className="w-full md:w-3/5 flex flex-col justify-center gap-10">
          <div>
            <p className="text-brand-accent text-xs font-bold uppercase tracking-[0.4em] mb-6">Formación de Élite</p>
            <h1 className="text-6xl md:text-8xl font-light leading-[1] mb-8 tracking-tighter">
              Sheepdog <br/>
              <span className="serif text-brand-accent">Training Campus</span>
            </h1>
            <p className="text-lg text-white/50 max-w-lg leading-relaxed font-light">
              Bienvenido al campo virtual de GALPA. Un espacio diseñado para la excelencia en el manejo de pastoreo, integrando técnicas tradicionales con análisis digital avanzado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
            <div className="p-8 border border-white/5 bg-white/[0.02] rounded-xl group hover:border-brand-accent/20 transition-colors">
              <span className="block text-brand-accent text-xs font-bold uppercase tracking-widest mb-3">01. Gestión</span>
              <p className="text-xs text-white/40 leading-relaxed uppercase tracking-widest font-medium">Seguimiento personalizado de alumnos y progreso técnico en tiempo real.</p>
            </div>
            <div className="p-8 border border-white/5 bg-white/[0.02] rounded-xl group hover:border-brand-accent/20 transition-colors">
              <span className="block text-brand-accent text-xs font-bold uppercase tracking-widest mb-3">02. Recursos</span>
              <p className="text-xs text-white/40 leading-relaxed uppercase tracking-widest font-medium">Librería exclusiva de vídeos, esquemas de campo y tutoriales tácticos.</p>
            </div>
          </div>

          <div className="pt-4">
             <button 
                onClick={onStart}
                className="group relative bg-brand-accent hover:bg-brand-accent-hover text-brand-bg px-10 py-5 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all overflow-hidden flex items-center gap-4 shadow-xl shadow-brand-accent/10"
              >
                <span>Acceder al Campus</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
        </div>

        {/* Right Side: Visual / Placeholder */}
        <div className="w-full md:w-2/5 hidden md:flex items-center justify-center relative">
            <div className="w-full aspect-square border border-white/10 rounded-3xl p-1 relative overflow-hidden">
                <img 
                    src="https://picsum.photos/seed/bordercollie/800/800" 
                    alt="Pastoreo" 
                    className="w-full h-full object-cover rounded-[1.2rem] grayscale opacity-40 group-hover:opacity-60 transition-opacity"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-bg/40 mix-blend-multiply"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-brand-accent" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-white/60">Contenido Exclusivo</span>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- View: Login ---

function LoginView({ onSuccess, onBack }: { onSuccess: (data: AlumnoData) => void; onBack: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${LOGIN_SCRIPT_URL}?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error("Servidor no disponible");
      
      const data = await response.json();

      if (data.success) {
        onSuccess(data);
      } else {
        setError(data.message || "Usuario o contraseña incorrectos");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error de conexión. Verifica el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex items-center justify-center px-6 py-20 bg-brand-bg relative"
    >
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-brand-surface border border-white/10 p-12 rounded-2xl shadow-2xl relative overflow-hidden z-10">
        {/* Subtle gradient top edge */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold mb-3 tracking-tight text-white">Acceso Campus</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Portal Educativo GALPA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-black ml-1">Identificación</label>
            <input 
              type="text" 
              required 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-brand-bg border border-white/10 rounded-lg px-5 py-4 text-sm focus:outline-none focus:border-brand-accent transition-all placeholder:text-white/5" 
              placeholder="Nombre de usuario"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-black ml-1">Clave de Acceso</label>
            <input 
              type="password" 
              required 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-brand-bg border border-white/10 rounded-lg px-5 py-4 text-sm focus:outline-none focus:border-brand-accent transition-all placeholder:text-white/5" 
              placeholder="••••••••"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-rose-500/10 text-rose-500 p-4 rounded-lg text-[10px] uppercase tracking-widest font-black border border-rose-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-white/5 disabled:text-white/20 text-brand-bg font-black text-xs uppercase tracking-[0.2em] py-5 rounded-lg transition-all shadow-lg shadow-brand-accent/5 active:scale-[0.98]"
          >
            {loading ? "Verificando..." : "Entrar al Campo Virtual"}
          </button>

          <div className="flex justify-between pt-4">
             <button 
                type="button"
                onClick={onBack}
                className="text-[10px] uppercase tracking-widest text-white/30 hover:text-brand-accent transition-colors"
              >
                Cancelar
              </button>
              <a href="#" className="text-[10px] uppercase tracking-widest text-white/30 hover:text-brand-accent transition-colors">Solicitar Registro</a>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// --- View: Dashboard ---

function DashboardView({ user, onLogout }: { user: AlumnoData; onLogout: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-brand-bg"
    >
      {/* Header Panel */}
      <div className="px-12 py-20 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px] translate-x-20 -translate-y-20"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10 relative z-10">
          <div className="space-y-4">
            <h1 className="text-6xl font-light tracking-tighter leading-[0.9]">
                Centro de <br/>
                <span className="serif text-brand-accent">Aprendizaje</span>
            </h1>
            <div className="flex items-center gap-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_var(--color-brand-accent)]"></div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">
                  Panel de Alumno: <span className="text-white">{user.user}</span>
                </p>
            </div>
          </div>

          <div className="flex gap-12 border-l border-white/10 pl-12 h-20 items-center">
             <div className="space-y-1">
                <span className="block text-[32px] font-light leading-none text-brand-accent">{user.classes.length}</span>
                <span className="block text-[8px] uppercase tracking-widest font-black text-white/20">Clases Registradas</span>
             </div>
             <div className="space-y-1">
                <span className="block text-[32px] font-light leading-none text-blue-400">AA</span>
                <span className="block text-[8px] uppercase tracking-widest font-black text-white/20">Calificación Promedio</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-12 py-20 w-full grid grid-cols-1 gap-20">
          {user.classes.length === 0 ? (
            <div className="w-full py-40 border border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center gap-6">
              <Info className="w-8 h-8 text-white/10" />
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20">No se han encontrado registros de clases</p>
            </div>
          ) : (
            user.classes.map((clase, idx) => (
              <ClassCard 
                key={idx} 
                clase={clase} 
                index={idx} 
                userName={user.user} 
              />
            ))
          )}
      </div>
    </motion.div>
  );
}

interface ClassCardProps {
  clase: ClassItem;
  index: number;
  userName: string;
}

const ClassCard: React.FC<ClassCardProps> = ({ clase, index, userName }) => {
  const [comment, setComment] = useState(clase.notasAlumno || "");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const saveComment = async () => {
    if (!comment.trim()) return;
    setStatus("saving");

    try {
      const params = new URLSearchParams();
      params.append('action', 'updateAlumnoNotas');
      params.append('user', String(userName).trim());
      params.append('rowId', String(clase.id)); // Usamos el ID de la fila para precisión total
      params.append('notasAlumno', comment.trim());

      await fetch(DATA_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const savedData = sessionStorage.getItem("alumnoData");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        parsed.classes[index].notasAlumno = comment;
        sessionStorage.setItem("alumnoData", JSON.stringify(parsed));
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start"
    >
      {/* Video Side */}
      <div className="space-y-6">
        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/5 relative group">
          <iframe 
            src={`https://www.youtube.com/embed/${clase.videoUrl}`}
            className="absolute inset-0 w-full h-full grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
            title={clase.titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-accent">{clase.tipo || 'ENTRENAMIENTO'}</span>
                <span className="text-white/10 font-bold text-xs">/</span>
                <span className="text-[10px] uppercase tracking-widest font-black text-white/30">{formatDate(clase.fecha)}</span>
            </div>
            <div className="flex items-center gap-2">
                <Video className="w-3 h-3 text-white/20" />
                <span className="text-[8px] uppercase tracking-widest font-black text-white/20">Video-Análisis Activo</span>
            </div>
        </div>
      </div>

      {/* Content Side */}
      <div className="space-y-10 border-l border-white/5 pl-12 h-full flex flex-col justify-between">
        <div className="space-y-6">
            <h3 className="text-4xl font-light tracking-tight leading-none uppercase">
              {clase.titulo || 'Clase Magistral'}
            </h3>
            
            <div className="space-y-3">
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-accent">Feedback Técnico</h4>
                <p className="text-sm text-white/50 leading-relaxed font-light italic border-l border-brand-accent/20 pl-6 py-2">
                  "{clase.notas || 'Pendiente de revisión técnica.'}"
                </p>
            </div>
        </div>

        <div className="space-y-6">
            <div className="space-y-4">
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30">Anotaciones del Alumno</h4>
                <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={status === "saving"}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-5 text-sm focus:outline-none focus:border-brand-accent transition-all resize-none font-light text-white/70 min-h-[120px]"
                    placeholder="Reflexiones sobre la sesión..."
                />
            </div>
            
            <button 
                onClick={saveComment}
                disabled={status === "saving" || !comment.trim() || comment === clase.notasAlumno}
                className={`
                    w-full py-4 rounded-lg font-bold text-[9px] uppercase tracking-[0.3em] transition-all
                    ${status === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                    status === "error" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                    "bg-brand-accent text-brand-bg hover:bg-brand-accent-hover"}
                `}
            >
                {status === "saving" ? "Sincronizando..." : 
                 status === "success" ? "Notas Actualizadas" :
                 status === "error" ? "Inténtelo de nuevo" :
                 "Guardar Notas"}
            </button>
        </div>
      </div>
    </motion.article>
  );
};
