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
  students?: any[]; // Added for teacher role
  message?: string;
}

type ViewState = "landing" | "login" | "dashboard" | "teacher" | "service-detail";

interface TeacherViewState {
  mode: "list" | "student-detail";
  selectedStudent: any | null;
}

interface ServiceInfo {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  features: string[];
  quote: string;
}

// --- Constants ---

// IMPORTANTE: Usa una única URL para todo el script si has usado la versión "Integrada" (v1.5) que te pasé.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyB27KkQ4T5_Y9u-1pJxd7vrFxsBxz68QBEswYiaygkFoDuOxIgAyAYfjuTBdxF8asDug/exec";
const LOGIN_SCRIPT_URL = SCRIPT_URL;
const DATA_SCRIPT_URL = SCRIPT_URL;

const CLASS_TYPES = [
  "Online",
  "Seminarios Fin de semana",
  "Webminar",
  "Acceso a material temático exclusivo alumnos",
  "Curso Intensivo cuatrimestral"
];

const SERVICES: ServiceInfo[] = [
  {
    id: "clases-online",
    title: "Online",
    description: "Análisis técnico de precisión desde cualquier lugar.",
    longDescription: "Nuestro sistema de formación digital te permite recibir correcciones técnicas en tiempo real. Analizamos tus vídeos, corregimos posiciones y trazamos líneas de trabajo personalizadas sin necesidad de desplazamiento. La tecnología al servicio de la tradición.",
    image: `${import.meta.env.BASE_URL}online.png`,
    features: ["Video-análisis en directo", "Sesiones personalizadas", "Grabación de la sesión para repaso", "Plan de trabajo Semanal"],
    quote: "Ayuda a tu perro para que en el futuro tu perro pueda ayudarte a ti."
  },
  {
    id: "seminarios",
    title: "Seminarios Fin de semana",
    description: "Evolución y convivencia técnica, en casa o en ruta.",
    longDescription: "Dos jornadas de trabajo intensivo en nuestras instalaciones o fuera de ellas (Consultar disponibilidad). Enfocadas en la evolución tanto de perros como de guías. Una experiencia de convivencia y aprendizaje técnico de alto impacto.",
    image: `${import.meta.env.BASE_URL}seminarios.png`,
    features: ["Práctica real con rebaño", "Grupos reducidos", "Evaluación de instinto", "Estrategias de desarrollo formativo"],
    quote: "La evolución técnica se forja en el campo, entendiendo cada presión y cada silencio."
  },
  {
    id: "webminar",
    title: "Webminar",
    description: "Conocimiento táctico y teoría aplicada.",
    longDescription: "Sesiones temáticas sobre psicología canina aplicada al pastoreo, gestión de rebaños y tácticas de concurso. La base teórica necesaria para entender el 'por qué' de cada movimiento en el campo.",
    image: `${import.meta.env.BASE_URL}webinar.png`,
    features: ["Temarios Especificos", "Material de apoyo descargable", "Acceso a la grabación", "Ronda de preguntas y respuestas"],
    quote: "La teoría sin práctica es estéril, pero la práctica sin teoría es ciega."
  },
  {
    id: "material-exclusivo",
    title: "Acceso a material exclusivo",
    description: "Tu biblioteca técnica de referencia.",
    longDescription: "Acceso ilimitado a nuestra videoteca premium. Incluye tutoriales paso a paso, análisis de trabajos especificos con esquemas tácticos que te ayudarán a reconocer y solventar todas las situaciones.",
    image: `${import.meta.env.BASE_URL}Material exclusivo.png`,
    features: ["Tutoriales HD", "Esquemas de maniobras", "Análisis de trabajos", "Actualizaciones semanales"],
    quote: "La maestría nace de la observación constante y el análisis de cada detalle táctico."
  },
  {
    id: "intensivo",
    title: "Curso Intensivo cuatrimestral",
    description: "La corona del aprendizaje en GALPA.",
    longDescription: "Un programa estructurado para aquellos que buscan la maestría. Cuatro meses de seguimiento riguroso, objetivos por etapas y monitorización constante del progreso del binomio guía-perro.",
    image: `${import.meta.env.BASE_URL}Curso Cuatrimestral.png`,
    features: ["Módulos teóricos y prácticos", "Modalidad mixta presencial-Online", "Examen de nivel por etapa", "Seguimiento prioritario"],
    quote: "El compromiso con la excelencia requiere tiempo, paciencia y una estructura de trabajo sólida."
  }
];

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

const getYoutubeId = (url: string) => {
  if (!url) return "";
  let id = url;
  if (id.includes("v=")) id = id.split("v=")[1].split("&")[0];
  if (id.includes("youtu.be/")) id = id.split("youtu.be/")[1].split("?")[0];
  if (id.includes("embed/")) id = id.split("embed/")[1].split("?")[0];
  return id;
};

// --- Components ---

// Sincronización con la nueva ruta /online/
export default function App() {
  const [view, setView] = useState<ViewState>("landing");
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [user, setUser] = useState<AlumnoData | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const savedData = sessionStorage.getItem("alumnoData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUser(parsed);
        const isTeacher = parsed.user?.toUpperCase().includes("GALPA");
        if (isTeacher) {
          setView("teacher");
        } else {
          setView("dashboard");
        }
      } catch (e) {
        sessionStorage.removeItem("alumnoData");
      }
    }
  }, []);

  const handleLoginSuccess = (data: AlumnoData, password?: string) => {
    // Inject password for session refreshes
    const sessionData = { ...data, _auth: password };
    setUser(sessionData);
    sessionStorage.setItem("alumnoData", JSON.stringify(sessionData));
    const isTeacher = data.user?.toUpperCase().includes("GALPA");
    if (isTeacher) {
      setView("teacher");
    } else {
      setView("dashboard");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("alumnoData");
    setUser(null);
    setView("landing");
  };

  const openService = (service: ServiceInfo) => {
    setSelectedService(service);
    setView("service-detail");
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-12 h-20 flex justify-between items-center">
            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => setView("landing")}
            >
              <div className="h-12 w-auto flex items-center justify-center">
                <img 
                  src={`${import.meta.env.BASE_URL}Logo.png`}
                  alt="GALPA Logo" 
                  className="h-full w-auto object-contain"
                  onError={(e) => {
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
              <span className="text-xs tracking-[0.3em] font-bold uppercase transition-colors group-hover:text-brand-accent whitespace-nowrap">GALPA</span>
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
          {view === "landing" && (
            <LandingView 
              onStart={() => setView("login")} 
              onServiceClick={openService}
            />
          )}
          {view === "service-detail" && selectedService && (
            <ServiceDetailView 
              service={selectedService} 
              onBack={() => setView("landing")} 
            />
          )}
          {view === "login" && (
            <LoginView 
              onSuccess={handleLoginSuccess} 
              onBack={() => setView("landing")} 
            />
          )}
          {view === "dashboard" && user && (
            <DashboardView user={user} onLogout={handleLogout} />
          )}
          {view === "teacher" && user && (
            <TeacherDashboard onLogout={handleLogout} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-12 py-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] uppercase tracking-[0.3em] font-medium text-brand-ink/30">
        <div className="flex gap-8">
          <span>GALPA © 2026 <span className="ml-2 font-mono text-brand-ink/40">v0.3.15</span></span>
          <span className="text-brand-ink/10 hidden md:block">|</span>
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

function LandingView({ onStart, onServiceClick }: { onStart: () => void; onServiceClick: (s: ServiceInfo) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-12 py-10 gap-32 relative z-10"
    >
      <div className="flex flex-col md:flex-row gap-20">
        {/* Left Side: Content */}
        <div className="w-full md:w-3/5 flex flex-col justify-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-brand-accent text-xs font-bold uppercase tracking-[0.4em] mb-6">Excelencia en Pastoreo</p>
            <h1 className="text-6xl md:text-8xl font-light leading-[1] mb-8 tracking-tighter text-brand-ink">
              Formación de <br/>
              <span className="serif text-brand-accent italic">Alto Rendimiento</span>
            </h1>
            <p className="text-lg text-brand-ink-muted max-w-lg leading-relaxed font-light">
              Donde la tradición se encuentra con la precisión digital. En GALPA, diseñamos programas exclusivos para binomios que buscan el máximo nivel técnico.
            </p>
          </motion.div>

          <div className="pt-4">
             <button 
                onClick={onStart}
                className="group relative bg-brand-accent hover:bg-brand-accent-hover text-brand-bg px-10 py-5 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all overflow-hidden flex items-center gap-4 shadow-xl shadow-brand-accent/10"
              >
                <span>Acceso Alumnos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
        </div>

        {/* Right Side: Visual */}
        <div className="w-full md:w-2/5 hidden md:flex items-center justify-center relative">
            <div className="w-full aspect-square border border-brand-border rounded-3xl p-1 relative overflow-hidden bg-white group shadow-2xl">
                <img 
                    src={`${import.meta.env.BASE_URL}Hero.jpg`}
                    alt="GALPA Hero" 
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/seed/bordercollie/800/800";
                    }}
                    referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-full border border-brand-border shadow-2xl">
                    <div className="w-8 h-8 bg-brand-accent/10 rounded-full flex items-center justify-center">
                        <Video className="w-3 h-3 text-brand-accent" />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-black text-brand-ink/80">Contenido Exclusivo</span>
                </div>
            </div>
        </div>
      </div>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto w-full space-y-16">
        <div className="space-y-4">
          <h2 className="text-4xl font-light tracking-tight text-brand-ink">Nuestra <span className="serif text-brand-accent">Oferta Académica</span></h2>
          <p className="text-[10px] text-brand-ink/40 uppercase tracking-[0.4em] font-bold">Programas de especialización técnica</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onServiceClick(service)}
              className="group bg-white border border-brand-border rounded-2xl p-10 flex flex-col gap-8 hover:border-brand-accent/30 transition-all cursor-pointer relative overflow-hidden h-full shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl translate-x-12 -translate-y-12 group-hover:bg-brand-accent/10 transition-colors"></div>
              
              <div className="space-y-4 relative z-10 flex-1">
                <h3 className="text-2xl font-light tracking-tight leading-tight group-hover:text-brand-accent transition-colors text-brand-ink">{service.title}</h3>
                <p className="text-xs text-brand-ink/60 leading-relaxed font-medium uppercase tracking-widest">{service.description}</p>
              </div>

              <div className="pt-8 border-t border-brand-border flex justify-between items-center relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-ink/20 group-hover:text-brand-accent transition-colors">Explorar Programa</span>
                <div className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center group-hover:bg-brand-accent group-hover:border-brand-accent transition-all">
                  <ChevronRight className="w-3 h-3 group-hover:text-brand-bg transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Methodology Section */}
      <section id="about" className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 items-center py-20 px-12 md:px-0">
         <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-brand-border bg-white p-12 shadow-2xl flex items-center justify-center">
            <img 
              src={`${import.meta.env.BASE_URL}Logo.png`}
              alt="Logo GALPA" 
              className="w-full h-full object-contain transition-all duration-1000 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "https://picsum.photos/seed/galpa/800/800";
              }}
              referrerPolicy="no-referrer"
            />
         </div>
         <div className="space-y-8">
            <p className="text-brand-accent text-xs font-bold uppercase tracking-[0.4em]">El Método Galpa</p>
            <h2 className="text-5xl font-light leading-tight tracking-tight text-brand-ink">Formación <span className="serif italic text-brand-accent">Sistemática</span></h2>
            <div className="space-y-6">
              {[
                { t: "Comprensión e Instinto", d: "Lectura profunda del perro para armonizar su intención natural con la técnica." },
                { t: "Psicología de Rebaño", d: "Análisis de movimientos adecuados basados en la presión y el entendimiento del espacio." },
                { t: "Eficiencia en Granja", d: "Estrategias de manejo real para la máxima funcionalidad en el trabajo diario con ganado." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="text-brand-accent font-mono text-xl opacity-20">{String(i+1).padStart(2,'0')}</div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-brand-ink">{item.t}</h4>
                    <p className="text-sm text-brand-ink/60 leading-relaxed font-light">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </section>
    </motion.div>
  );
}

// --- View: Service Detail ---

function ServiceDetailView({ service, onBack }: { service: ServiceInfo; onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 flex flex-col relative z-10"
    >
      {/* Hero Section */}
      <div className="px-12 py-24 border-b border-brand-border bg-brand-accent/[0.03] relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center justify-between">
           <div className="space-y-8 max-w-xl">
             <button 
                onClick={onBack}
                className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold text-brand-ink/40 hover:text-brand-accent transition-colors mb-4"
              >
                <X className="w-3 h-3" />
                Volver a la oferta
              </button>
             <h1 className="text-6xl md:text-7xl font-light tracking-tighter leading-none text-brand-ink">{service.title}</h1>
             <p className="text-xl text-brand-ink/60 leading-relaxed font-light">{service.longDescription}</p>
           </div>
           
           <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden border border-brand-border shadow-2xl relative group">
              <img 
                src={service.image} 
                alt={service.title} 
                className="w-full h-full object-cover transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand-accent/5 group-hover:bg-transparent transition-colors"></div>
           </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-12 py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-24">
         <div className="space-y-12">
            <h2 className="text-3xl font-light tracking-tight flex items-center gap-4 text-brand-ink">
               <span className="w-12 h-[1px] bg-brand-accent/40"></span>
               Inclusiones del Programa
            </h2>
            <div className="grid grid-cols-1 gap-6">
               {service.features.map((feature, i) => (
                 <div key={i} className="flex items-center gap-6 p-6 bg-white border border-brand-border rounded-xl hover:border-brand-accent/20 transition-all group shadow-sm">
                    <div className="w-6 h-6 rounded-full border border-brand-accent/40 flex items-center justify-center group-hover:bg-brand-accent group-hover:border-brand-accent transition-all">
                       <CheckCircle2 className="w-3 h-3 text-brand-accent group-hover:text-brand-bg transition-colors" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-ink/70">{feature}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-12">
            <h2 className="text-3xl font-light tracking-tight flex items-center gap-4 text-brand-ink">
               <span className="w-12 h-[1px] bg-brand-accent/40"></span>
               Metodología Aplicada
            </h2>
            <div className="bg-white border border-brand-border p-12 rounded-2xl space-y-10 relative overflow-hidden shadow-sm">
               <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-accent/5 rounded-full blur-3xl"></div>
               <div className="space-y-6 relative z-10">
                  <p className="text-sm text-brand-ink/60 leading-relaxed font-light font-serif italic text-lg transition-colors">
                    "{service.quote}"
                  </p>
                  <div className="pt-6 border-t border-brand-border flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-brand-accent opacity-10"></div>
                     <div>
                        <span className="block text-[10px] uppercase tracking-widest font-black text-brand-ink">Cristobal Gálvez</span>
                        <span className="block text-[8px] uppercase tracking-[0.3em] font-bold text-brand-accent">Director Técnico GALPA</span>
                     </div>
                  </div>
               </div>
               
               <div className="pt-10">
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full py-5 border border-brand-accent/30 rounded-lg text-brand-accent text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-brand-accent hover:text-brand-bg transition-all"
                  >
                    Consultar Disponibilidad
                  </button>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

// --- View: Login ---

function LoginView({ onSuccess, onBack }: { onSuccess: (data: AlumnoData, pass?: string) => void; onBack: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Créditos de profesor directos
    if (user.trim().toUpperCase() === "GALPA" && pass === "@Joker2026") {
      onSuccess({
        success: true,
        user: user.trim(),
        classes: []
      }, pass);
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch(`${LOGIN_SCRIPT_URL}?action=getAllData&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);
      
      if (!resp.ok) throw new Error("Servidor no disponible");
      
      const data = await resp.json();

      if (data.success) {
        onSuccess(data, pass);
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

      <div className="w-full max-w-sm bg-white border border-brand-border p-12 rounded-2xl shadow-2xl relative overflow-hidden z-10">
        {/* Subtle gradient top edge */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold mb-3 tracking-tight text-brand-ink">Acceso Campus</h2>
          <p className="text-[10px] text-brand-ink/40 uppercase tracking-[0.2em] font-bold">Portal Educativo GALPA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-brand-ink/50 font-black ml-1">Identificación</label>
            <input 
              type="text" 
              required 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-5 py-4 text-sm focus:outline-none focus:border-brand-accent transition-all placeholder:text-brand-ink/10" 
              placeholder="Nombre de usuario"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-brand-ink/50 font-black ml-1">Clave de Acceso</label>
            <input 
              type="password" 
              required 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-5 py-4 text-sm focus:outline-none focus:border-brand-accent transition-all placeholder:text-brand-ink/10" 
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
            className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-ink/5 disabled:text-brand-ink/20 text-brand-bg font-black text-xs uppercase tracking-[0.2em] py-5 rounded-lg transition-all shadow-lg shadow-brand-accent/5 active:scale-[0.98]"
          >
            {loading ? "Verificando..." : "Entrar al Campo Virtual"}
          </button>

          <div className="flex justify-between pt-4">
             <button 
                type="button"
                onClick={onBack}
                className="text-[10px] uppercase tracking-widest text-brand-ink/30 hover:text-brand-accent transition-colors"
              >
                Cancelar
              </button>
              <a href="#" className="text-[10px] uppercase tracking-widest text-brand-ink/30 hover:text-brand-accent transition-colors">Solicitar Registro</a>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// --- View: Teacher Dashboard ---

function TeacherDashboard({ onLogout }: { onLogout: () => void }) {
  const [selectedType, setSelectedType] = useState("Todos");
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // No cargando por defecto si ya tenemos datos
  const [teacherView, setTeacherView] = useState<TeacherViewState>({ mode: "list", selectedStudent: null });

  const fetchStudents = async () => {
    setLoading(true);
    const savedData = sessionStorage.getItem("alumnoData");
    if (!savedData) return;
    
    const parsed = JSON.parse(savedData);
    const userParam = parsed.user;
    const passParam = parsed._auth || "@Joker2026";
    
    try {
      const response = await fetch(`${LOGIN_SCRIPT_URL}?action=getAllData&user=${encodeURIComponent(userParam)}&pass=${encodeURIComponent(passParam)}`);
      const data = await response.json();
      
      if (data.success) {
        setAllStudents(data.students || []);
        // Actualizar caché
        parsed.students = data.students;
        sessionStorage.setItem("alumnoData", JSON.stringify(parsed));
      } else {
        console.error("Fetch students error:", data.message);
        if (parsed.students) setAllStudents(parsed.students);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      // Si falla el fetch pero tenemos caché, la usamos
      if (parsed.students) setAllStudents(parsed.students);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedData = sessionStorage.getItem("alumnoData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.students) {
        setAllStudents(parsed.students);
      } else {
        fetchStudents();
      }
    }
  }, []);

  const filteredStudents = allStudents.filter(student => {
    if (selectedType === "Todos") return true;
    return student.classes.some((c: any) => c.tipo === selectedType);
  });

  if (teacherView.mode === "student-detail" && teacherView.selectedStudent) {
    return (
      <TeacherStudentDetail 
        student={teacherView.selectedStudent} 
        onBack={() => setTeacherView({ mode: "list", selectedStudent: null })}
        onRefresh={fetchStudents}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-brand-bg"
    >
      {/* Header Panel */}
      <div className="px-12 py-16 border-b border-brand-border bg-brand-accent/[0.03] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-5xl font-light tracking-tighter leading-none text-brand-ink">
                Panel de <span className="serif text-brand-accent">Gestión Académica</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-ink/40">
              Instructor Principal GALPA
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            {["Todos", ...CLASS_TYPES].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-widest font-bold border transition-all ${
                  selectedType === type 
                  ? "bg-brand-accent border-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20" 
                  : "bg-brand-accent/5 border-brand-border text-brand-ink/40 hover:border-brand-accent/30 shadow-sm"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-12 py-16 w-full">
        {loading && allStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-accent/60">Cargando base de datos...</span>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex items-center justify-between border-b border-brand-border pb-6">
               <h2 className="text-xl font-light tracking-tight flex items-center gap-3 text-brand-ink">
                 <Users className="w-5 h-5 text-brand-accent" />
                 Alumnos en <span className="text-brand-accent italic serif">{selectedType}</span>
               </h2>
               <div className="flex items-center gap-6">
                  <button 
                    onClick={fetchStudents}
                    className="text-[9px] uppercase tracking-widest font-bold text-brand-ink/30 hover:text-brand-accent transition-colors"
                  >
                    Actualizar Datos
                  </button>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/20">
                    {filteredStudents.length} Alumno{filteredStudents.length !== 1 ? 's' : ''}
                  </span>
               </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-brand-border rounded-2xl bg-white shadow-sm">
                 <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-ink/30">No hay alumnos registrados en esta categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setTeacherView({ mode: "student-detail", selectedStudent: student })}
                    className="bg-white border border-brand-border p-8 rounded-xl hover:border-brand-accent/40 transition-all group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl translate-x-12 -translate-y-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="w-12 h-12 bg-brand-bg rounded-lg border border-brand-border flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-brand-accent" />
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase tracking-widest font-black text-brand-ink/20">Clases Totales</span>
                        <span className="text-xl font-light text-brand-accent">{student.classes.length}</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-medium mb-1 group-hover:text-brand-accent transition-colors text-brand-ink">{student.user}</h3>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 mb-6">Ver expediente completo</p>
                    </div>
                    
                    <div className="space-y-4 border-t border-brand-border pt-6 relative z-10">
                       {student.classes.filter((c: any) => selectedType === "Todos" || c.tipo === selectedType).slice(0, 2).map((c: any, cIdx: number) => (
                         <div key={cIdx} className="flex items-center gap-3">
                            <Play className="w-2 h-2 text-brand-accent" />
                            <span className="text-[9px] uppercase tracking-widest font-medium text-brand-ink/60 truncate">{c.titulo}</span>
                         </div>
                       ))}
                       {student.classes.filter((c: any) => selectedType === "Todos" || c.tipo === selectedType).length > 2 && (
                         <p className="text-[8px] uppercase tracking-widest font-bold text-brand-accent italic">
                            + {student.classes.filter((c: any) => selectedType === "Todos" || c.tipo === selectedType).length - 2} clases más
                         </p>
                       )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- View: Teacher Student Detail ---

function TeacherStudentDetail({ student, onBack, onRefresh }: { student: any; onBack: () => void; onRefresh: () => void }) {
  const [showAddClass, setShowAddClass] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col bg-brand-bg relative z-10"
    >
      {/* Header Panel */}
      <div className="px-12 py-16 border-b border-brand-border bg-brand-accent/[0.03] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4">
             <button 
                onClick={onBack}
                className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold text-brand-ink/40 hover:text-brand-accent transition-colors mb-4"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
                Volver al listado
              </button>
            <h1 className="text-5xl font-light tracking-tighter leading-none text-brand-ink">
                Expediente: <span className="serif text-brand-accent">{student.user}</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-ink/40 italic">
              Modo Edición: Feedback de Instructor Activo
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
               onClick={() => setShowAddClass(!showAddClass)}
               className={`px-8 py-4 rounded-lg text-[9px] uppercase tracking-[0.2em] font-bold transition-all shadow-xl flex items-center gap-3 ${
                 showAddClass 
                 ? "bg-brand-ink/10 text-brand-ink border border-brand-border" 
                 : "bg-brand-accent text-brand-bg border border-brand-accent shadow-brand-accent/20"
               }`}
            >
              <Video className="w-3 h-3" />
              {showAddClass ? "Cancelar" : "Nueva Clase Bono-Online"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-12 py-16 w-full space-y-16">
        {showAddClass && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 bg-brand-surface border border-brand-accent/30 rounded-2xl shadow-2xl shadow-brand-accent/5"
          >
            <AddNewClassForm 
              studentName={student.user} 
              onSuccess={() => {
                setShowAddClass(false);
                onRefresh();
              }} 
            />
          </motion.div>
        )}

        <div className="space-y-24">
          {student.classes.slice().reverse().map((clase: ClassItem, idx: number) => (
             <TeacherClassCard 
               key={clase.id || idx} 
               clase={clase} 
               studentName={student.user} 
               onUpdate={onRefresh}
             />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// --- Component: Teacher Class Card ---

interface TeacherClassCardProps {
  clase: ClassItem;
  studentName: string;
  onUpdate: () => void;
}

const TeacherClassCard: React.FC<TeacherClassCardProps> = ({ clase, studentName, onUpdate }) => {
  const [teacherNotas, setTeacherNotas] = useState(clase.notas || "");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const saveFeedback = async () => {
    if (!teacherNotas.trim()) return;
    setStatus("saving");

    try {
      const resp = await fetch(`${DATA_SCRIPT_URL}?action=updateTeacherNotas&user=${encodeURIComponent(studentName.trim())}&rowId=${clase.id}&notas=${encodeURIComponent(teacherNotas.trim())}`, {
        method: 'POST'
      });
      
      setStatus("success");
      onUpdate();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start opacity-90 hover:opacity-100 transition-opacity">
       {/* Video Side */}
       <div className="space-y-6">
        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-brand-border relative group shadow-2xl">
          <iframe 
            src={`https://www.youtube.com/embed/${getYoutubeId(clase.videoUrl)}`}
            className="absolute inset-0 w-full h-full grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
            title={clase.titulo}
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
        <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-accent">{clase.tipo}</span>
                <span className="text-brand-ink/10 font-bold text-xs">/</span>
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-ink/30">{formatDate(clase.fecha)}</span>
            </div>
            <span className="text-[8px] uppercase tracking-widest font-black text-brand-ink/20">ID REF: #{clase.id}</span>
        </div>
      </div>

      {/* Content Side */}
      <div className="space-y-10 border-l border-brand-accent/10 pl-12 h-full flex flex-col justify-between">
        <div className="space-y-6">
            <h3 className="text-4xl font-light tracking-tight leading-none uppercase text-brand-ink">
              {clase.titulo}
            </h3>
            
            <div className="space-y-4">
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-accent">Comentario del Instructor (Editable)</h4>
                <textarea 
                    value={teacherNotas}
                    onChange={(e) => setTeacherNotas(e.target.value)}
                    disabled={status === "saving"}
                    className="w-full bg-white border border-brand-border rounded-lg p-5 text-sm focus:outline-none focus:border-brand-accent transition-all resize-none font-light text-brand-ink h-32 leading-relaxed shadow-sm"
                    placeholder="Escribe tu análisis técnico aquí..."
                />
                <button 
                    onClick={saveFeedback}
                    disabled={status === "saving" || teacherNotas === clase.notas}
                    className={`
                        w-full py-4 rounded-lg font-bold text-[9px] uppercase tracking-[0.3em] transition-all
                        ${status === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                        status === "error" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                        "bg-brand-accent/20 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent hover:text-brand-bg"}
                    `}
                >
                    {status === "saving" ? "Guardando Feedback..." : 
                     status === "success" ? "Cambios sincronizados" :
                     status === "error" ? "Error al guardar" :
                     "Actualizar Comentario Profesor"}
                </button>
            </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-brand-border opacity-60">
            <h4 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-ink/30">Reflexión Alumno</h4>
            <div className="bg-brand-accent/5 border border-brand-border rounded-lg p-5">
              <p className="text-xs text-brand-ink/60 leading-relaxed font-light">
                {clase.notasAlumno || "El alumno aún no ha realizado anotaciones."}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Add New Class Form ---

const AddNewClassForm = ({ studentName, onSuccess }: { studentName: string; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    titulo: "",
    videoUrl: "",
    fecha: new Date().toISOString().split('T')[0],
    tipo: "Online",
    notas: ""
  });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.videoUrl) return;
    
    setStatus("saving");
    try {
      // Extraemos el ID de YouTube si pegan la URL completa
      let vidId = formData.videoUrl;
      if (vidId.includes("v=")) vidId = vidId.split("v=")[1].split("&")[0];
      if (vidId.includes("youtu.be/")) vidId = vidId.split("youtu.be/")[1].split("?")[0];

      const url = `${DATA_SCRIPT_URL}?action=addNewClass&user=${encodeURIComponent(studentName)}&fecha=${encodeURIComponent(formData.fecha)}&titulo=${encodeURIComponent(formData.titulo)}&videoUrl=${encodeURIComponent(vidId)}&notas=${encodeURIComponent(formData.notas)}&tipo=${encodeURIComponent(formData.tipo)}`;

      await fetch(url, { method: 'POST' });

      setStatus("success");
      setTimeout(() => {
        onSuccess();
        setStatus("idle");
      }, 1500);
    } catch (err) {
      console.error("Add class error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
       <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase tracking-widest text-brand-accent">Nueva Clase: Online</h3>
          <span className="text-[10px] uppercase tracking-widest font-black text-brand-ink/20">Destinatario: {studentName}</span>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Título de la Sesión</label>
             <input 
               type="text" 
               required
               value={formData.titulo}
               onChange={e => setFormData({...formData, titulo: e.target.value})}
               className="w-full bg-white border border-brand-border rounded-lg p-4 text-sm focus:border-brand-accent text-brand-ink outline-none shadow-sm"
               placeholder="Ej: Análisis Posición Outrun..."
             />
          </div>
          <div className="space-y-3">
             <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">URL/ID Video YouTube</label>
             <input 
               type="text" 
               required
               value={formData.videoUrl}
               onChange={e => setFormData({...formData, videoUrl: e.target.value})}
               className="w-full bg-white border border-brand-border rounded-lg p-4 text-sm focus:border-brand-accent text-brand-ink outline-none shadow-sm"
               placeholder="https://www.youtube.com/watch?v=..."
             />
          </div>
       </div>

       <div className="space-y-3">
          <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Feedback Inicial del Instructor</label>
          <textarea 
             value={formData.notas}
             onChange={e => setFormData({...formData, notas: e.target.value})}
             className="w-full bg-white border border-brand-border rounded-lg p-4 text-sm focus:border-brand-accent text-brand-ink outline-none h-24 shadow-sm"
             placeholder="Primeras impresiones de la clase..."
          />
       </div>

       <button 
         type="submit"
         disabled={status === "saving"}
         className="w-full bg-brand-accent py-5 rounded-lg text-brand-bg font-black text-[10px] uppercase tracking-[0.4em] hover:bg-brand-accent-hover transition-all"
       >
         {status === "saving" ? "Sincronizando con Excel..." : 
          status === "success" ? "Sesión Añadida con éxito" : "Registrar Nueva Clase"}
       </button>
    </form>
  );
};

// --- View: Dashboard ---

function DashboardView({ user, onLogout }: { user: AlumnoData; onLogout: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-brand-bg"
    >
      {/* Header Panel */}
      <div className="px-12 py-20 border-b border-brand-border bg-brand-accent/[0.03] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px] translate-x-20 -translate-y-20"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10 relative z-10">
          <div className="space-y-4">
            <h1 className="text-6xl font-light tracking-tighter leading-[0.9] text-brand-ink">
                Centro de <br/>
                <span className="serif text-brand-accent">Aprendizaje</span>
            </h1>
            <div className="flex items-center gap-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_var(--color-brand-accent)]"></div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-ink/40">
                  Panel de Alumno: <span className="text-brand-ink font-bold">{user.user}</span>
                </p>
            </div>
          </div>

          <div className="flex gap-12 border-l border-brand-border pl-12 h-20 items-center">
             <div className="space-y-1">
                <span className="block text-[32px] font-light leading-none text-brand-accent">{user.classes.length}</span>
                <span className="block text-[8px] uppercase tracking-widest font-black text-brand-ink/20">Clases Registradas</span>
             </div>
             <div className="space-y-1">
                <span className="block text-[32px] font-light leading-none text-blue-600">AA</span>
                <span className="block text-[8px] uppercase tracking-widest font-black text-brand-ink/20">Calificación Promedio</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-12 py-20 w-full grid grid-cols-1 gap-20">
          {user.classes.length === 0 ? (
            <div className="w-full py-40 border border-brand-border bg-white rounded-2xl flex flex-col items-center justify-center gap-6 shadow-sm">
              <Info className="w-8 h-8 text-brand-ink/10" />
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-ink/20">No se han encontrado registros de clases</p>
            </div>
          ) : (
            user.classes.slice().reverse().map((clase, idx) => (
              <ClassCard 
                key={user.classes.length - 1 - idx} 
                clase={clase} 
                index={user.classes.length - 1 - idx} 
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
      const url = `${DATA_SCRIPT_URL}?action=updateAlumnoNotas&user=${encodeURIComponent(userName.trim())}&rowId=${clase.id}&notasAlumno=${encodeURIComponent(comment.trim())}`;
      
      await fetch(url, { method: 'POST' });

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
        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-brand-border relative group shadow-2xl">
          <iframe 
            src={`https://www.youtube.com/embed/${getYoutubeId(clase.videoUrl)}`}
            className="absolute inset-0 w-full h-full grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
            title={clase.titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-accent">{clase.tipo || 'ENTRENAMIENTO'}</span>
                <span className="text-brand-ink/10 font-bold text-xs">/</span>
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-ink/30">{formatDate(clase.fecha)}</span>
            </div>
            <div className="flex items-center gap-2">
                <Video className="w-3 h-3 text-brand-ink/20" />
                <span className="text-[8px] uppercase tracking-widest font-black text-brand-ink/20">Video-Análisis Activo</span>
            </div>
        </div>
      </div>

      {/* Content Side */}
      <div className="space-y-10 border-l border-brand-border pl-12 h-full flex flex-col justify-between">
        <div className="space-y-6">
            <h3 className="text-4xl font-light tracking-tight leading-none uppercase text-brand-ink">
              {clase.titulo || 'Clase Magistral'}
            </h3>
            
            <div className="space-y-3">
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-accent">Feedback Técnico</h4>
                <p className="text-sm text-brand-ink/60 leading-relaxed font-light italic border-l border-brand-accent/20 pl-6 py-2">
                  "{clase.notas || 'Pendiente de revisión técnica.'}"
                </p>
            </div>
        </div>

        <div className="space-y-6">
            <div className="space-y-4">
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-ink/30">Anotaciones del Alumno</h4>
                <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={status === "saving"}
                    className="w-full bg-white border border-brand-border rounded-lg p-5 text-sm focus:outline-none focus:border-brand-accent transition-all resize-none font-light text-brand-ink/70 min-h-[120px] shadow-sm"
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
