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
  Video,
  ArrowLeft,
  Mail,
  Phone,
  Send,
  User as UserIcon
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
  online?: boolean;
  seminario?: boolean;
  webminar?: boolean;
  materialExclusivo?: boolean;
  cursoCuatrimestral?: boolean;
  students?: any[]; // Added for teacher role
  message?: string;
}

type ViewState = "landing" | "login" | "dashboard" | "teacher" | "service-detail" | "contact";

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
  "Seminario",
  "Webminar",
  "Material Exclusivo",
  "Curso Cuatrimestral"
];

const SERVICES: ServiceInfo[] = [
  {
    id: "clases-online",
    title: "Entrenamiento Online",
    description: "Análisis técnico de precisión para perro pastor desde cualquier lugar.",
    longDescription: "Nuestro sistema de formación digital para sheepdogs te permite recibir correcciones técnicas en tiempo real. Analizamos vídeos de tu border collie, corregimos posiciones y trazamos líneas de entrenamiento de pastoreo personalizadas.",
    image: `${import.meta.env.BASE_URL}online.png`,
    features: ["Video-análisis de pastoreo", "Clases Individualizadas", "Grabación de la sesión", "Plan de entrenamiento semanal"],
    quote: "Ayuda a tu perro para que en el futuro tu perro pueda ayudarte a ti."
  },
  {
    id: "seminarios",
    title: "Seminarios Fin de semana",
    description: "Evolución técnica con border collies en casa o en ruta.",
    longDescription: "Dos jornadas de entrenamiento intensivo con ovejas enfocadas en la evolución tanto de perros como de guías. Una experiencia de aprendizaje técnico de alto impacto para cualquier perro de pastoreo.",
    image: `${import.meta.env.BASE_URL}seminarios.png`,
    features: ["Práctica real con perro pastor", "Grupos reducidos", "Evaluación de instinto", "Estrategias de entrenamiento"],
    quote: "La evolución técnica se forja en el campo, entendiendo cada presión y cada silencio."
  },
  {
    id: "webminar",
    title: "Webinar Técnico",
    description: "Conocimiento táctico y teoría aplicada al sheepdog training.",
    longDescription: "Sesiones temáticas sobre psicología canina aplicada al pastoreo de border collies, gestión de rebaños y tácticas de concurso. La base teórica necesaria para el entrenamiento de perro pastor.",
    image: `${import.meta.env.BASE_URL}webinar.png`,
    features: ["Temarios de Pastoreo", "Material de apoyo", "Acceso a grabaciones", "Ronda de preguntas"],
    quote: "La teoría sin práctica es estéril, pero la práctica sin teoría es ciega."
  },
  {
    id: "material-exclusivo",
    title: "Acceso a Material Exclusivo",
    description: "Recursos técnicos para el entrenamiento de border collie.",
    longDescription: "Acceso ilimitado a nuestra videoteca premium de sheepdog training. Tutoriales paso a paso de entrenamiento de perro pastor y esquemas tácticos para reconocer y solventar situaciones en el campo.",
    image: `${import.meta.env.BASE_URL}Material exclusivo.png`,
    features: ["Tutoriales de Sheepdog", "Esquemas de maniobras", "Análisis de trabajos", "Actualizaciones de training"],
    quote: "La maestría nace de la observación constante y el análisis de cada detalle táctico."
  },
  {
    id: "intensivo",
    title: "Curso Intensivo Cuatrimestral",
    description: "La corona del aprendizaje y entrenamiento en GALPA.",
    longDescription: "Un programa estructurado para aquellos que buscan la maestría en el pastoreo profesional. Cuatro meses de seguimiento riguroso y entrenamiento intensivo para sheepdogs y sus guías.",
    image: `${import.meta.env.BASE_URL}Curso Cuatrimestral.png`,
    features: ["Módulos de Sheepdog Training", "Modalidad mixta presencial-Online", "Examen de nivel", "Seguimiento prioritario"],
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
  const [contactSource, setContactSource] = useState<string>("Consulta General");
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
              onContact={(source) => {
                setContactSource(source);
                setView("contact");
              }}
            />
          )}
          {view === "service-detail" && selectedService && (
            <ServiceDetailView 
              service={selectedService} 
              onBack={() => setView("landing")} 
              onContact={(source) => {
                setContactSource(source);
                setView("contact");
              }}
            />
          )}
          {view === "contact" && (
            <ContactView 
              source={contactSource}
              onBack={() => {
                if (selectedService) {
                  setView("service-detail");
                } else {
                  setContactSource("Consulta General");
                  setView("landing");
                }
              }} 
            />
          )}
          {view === "login" && (
            <LoginView 
              onSuccess={handleLoginSuccess} 
              onBack={() => setView("landing")} 
            />
          )}
          {view === "dashboard" && user && (
            <DashboardView 
              user={user} 
              onLogout={handleLogout} 
              onContact={(source) => {
                setContactSource(source);
                setView("contact");
              }}
            />
          )}
          {view === "teacher" && user && (
            <TeacherDashboard 
              user={user} 
              onLogout={handleLogout}
              onRefresh={async () => {
                const savedPass = sessionStorage.getItem("temp_p");
                if (savedPass && user.user) {
                  try {
                    const resp = await fetch(`${LOGIN_SCRIPT_URL}?action=getAllData&user=${encodeURIComponent(user.user)}&pass=${encodeURIComponent(savedPass)}`);
                    const data = await resp.json();
                    if (data.success) {
                      setUser(data);
                      sessionStorage.setItem("alumnoData", JSON.stringify(data));
                    }
                  } catch (e) {
                    console.error("Refresh error:", e);
                  }
                }
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-12 py-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] uppercase tracking-[0.3em] font-medium text-brand-ink/30">
        <div className="flex gap-8">
          <span>GALPA © 2026 <span className="ml-2 font-mono text-brand-ink/40">v1.2.1</span></span>
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

function LandingView({ onStart, onServiceClick, onContact }: { onStart: () => void; onServiceClick: (s: ServiceInfo) => void; onContact: (source: string) => void }) {
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
            <p className="text-brand-accent text-xs font-bold uppercase tracking-[0.4em] mb-6">Entrenamiento y Pastoreo Profesional</p>
            <h1 className="text-6xl md:text-8xl font-light leading-[1] mb-8 tracking-tighter text-brand-ink">
              Formación de <br/>
              <span className="serif text-brand-accent italic">Alto Rendimiento</span>
            </h1>
            <p className="text-lg text-brand-ink-muted max-w-lg leading-relaxed font-light">
              Donde la tradición se encuentra con la precisión digital. En GALPA, diseñamos programas de training técnico para perros pastor y sheepdogs que buscan el máximo nivel.
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
                    alt="Entrenamiento de perro pastor Sheepdog y Border Collie en GALPA" 
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
                    <span className="text-[9px] uppercase tracking-widest font-black text-brand-ink/80">Training Técnico Online</span>
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

function ServiceDetailView({ service, onBack, onContact }: { service: ServiceInfo; onBack: () => void; onContact: (source: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 flex flex-col relative z-10"
    >
      {/* Hero Section */}
      <div className="px-12 pt-12 pb-24 border-b border-brand-border bg-brand-accent/[0.03] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-ink/80 hover:text-brand-accent transition-colors mb-12 group"
          >
            <div className="w-8 h-8 rounded-full border border-brand-ink/10 flex items-center justify-center group-hover:border-brand-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Volver a la oferta
          </button>

          <div className="flex flex-col md:flex-row gap-20 items-center justify-between">
            <div className="space-y-8 max-w-xl">
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
                    onClick={() => onContact(service.title)}
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

// --- View: Contact Form ---

function ContactView({ source, onBack }: { source: string; onBack: () => void }) {
  const [formData, setFormData] = useState({ nombre: "", telefono: "", email: "", mensaje: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.telefono && !formData.email) {
      setErrorMsg("Por favor, introduce al menos un método de contacto (Teléfono o Email).");
      return;
    }

    setStatus("submitting");

    try {
      const url = `${SCRIPT_URL}?action=submitContactForm&nombre=${encodeURIComponent(formData.nombre)}&telefono=${encodeURIComponent(formData.telefono)}&email=${encodeURIComponent(formData.email)}&mensaje=${encodeURIComponent(formData.mensaje)}&fuente=${encodeURIComponent(source)}`;

      await fetch(url, {
        method: "POST"
      });

      setStatus("success");
    } catch (err) {
      console.error("Error submitting contact form:", err);
      // In these environments, fetch might fail CORS but still hit the server
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col items-center justify-center text-center px-12 py-32"
      >
        <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mb-10">
          <CheckCircle2 className="w-10 h-10 text-brand-accent" />
        </div>
        <h2 className="text-4xl font-light tracking-tight text-brand-ink mb-6">Consulta Enviada</h2>
        <p className="text-lg text-brand-ink/60 max-w-md leading-relaxed font-light mb-12">
          Se ha enviado tu consulta, pronto nos pondremos en contacto contigo.
        </p>
        <button 
          onClick={onBack}
          className="bg-brand-accent text-brand-bg px-10 py-5 rounded-lg font-bold text-xs uppercase tracking-[0.2em] hover:bg-brand-accent-hover transition-colors shadow-xl shadow-brand-accent/10"
        >
          Volver al programa
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-12 py-20 w-full"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-brand-ink/40 hover:text-brand-accent transition-colors mb-16"
      >
        <ArrowLeft className="w-4 h-4" />
        Regresar
      </button>

      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-5xl font-light tracking-tight text-brand-ink">Consultar <span className="serif italic text-brand-accent">Disponibilidad</span></h2>
          <p className="text-brand-accent text-[9px] uppercase tracking-widest font-bold">Interés: {source}</p>
          <p className="text-sm text-brand-ink/60 font-light max-w-md leading-relaxed">
            Completa el siguiente formulario y nos pondremos en contacto contigo para resolver tu consulta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-brand-border p-12 rounded-3xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Nombre Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/20" />
                <input 
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-accent transition-all font-light"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Teléfono de Contacto</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/20" />
                <input 
                  type="tel"
                  placeholder="Ej: +34 600 000 000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-accent transition-all font-light"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/20" />
              <input 
                type="email"
                placeholder="Ej: alumno@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-accent transition-all font-light"
              />
            </div>
          </div>

          {errorMsg && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs font-medium bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-3"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              {errorMsg}
            </motion.p>
          )}

          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Mensaje o Consulta</label>
            <textarea 
              required
              rows={4}
              placeholder="¿En qué fechas estarías interesado? ¿Tienes alguna duda técnica?"
              value={formData.mensaje}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
              className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-5 px-6 text-sm focus:outline-none focus:border-brand-accent transition-all font-light resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-brand-accent text-brand-bg py-5 rounded-xl font-bold text-xs uppercase tracking-[0.3em] hover:bg-brand-accent-hover transition-all flex items-center justify-center gap-4 shadow-xl shadow-brand-accent/20"
          >
            {status === "submitting" ? "Enviando..." : (
              <>
                <span>Enviar Consulta</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// --- Internal Message Modal ---

interface InternalMessage {
  id?: number;
  user: string;
  mensaje: string;
  respuesta?: string;
  fecha?: string;
}

function InternalMessageModal({ isOpen, onClose, userName }: { isOpen: boolean; onClose: () => void; userName: string }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<InternalMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "loading" | "success" | "error">("idle");

  const fetchHistory = async () => {
    setStatus("loading");
    try {
      const url = `${SCRIPT_URL}?action=getInternalMessages&user=${encodeURIComponent(userName)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.success) {
        setHistory(data.messages || []);
      }
      setStatus("idle");
    } catch (err) {
      console.error("Error fetching history:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setStatus("sending");

    try {
      const url = `${SCRIPT_URL}?action=submitInternalMessage&user=${encodeURIComponent(userName)}&mensaje=${encodeURIComponent(message)}`;
      await fetch(url, { method: "POST" });
      setStatus("success");
      setMessage("");
      // Refresh history after sending
      await fetchHistory();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Error sending internal message:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-brand-ink/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl h-[90vh] md:h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-brand-border flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-brand-border flex justify-between items-center shrink-0">
          <div className="space-y-1">
            <h3 className="text-3xl font-light tracking-tight text-brand-ink uppercase italic serif">Mis <span className="text-brand-accent not-italic font-sans">Mensajes</span></h3>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-ink/30">Conversación directa con Cristóbal</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-accent/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-brand-ink/40" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-brand-bg/10">
          {status === "loading" && history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[10px] uppercase tracking-widest font-bold text-brand-ink/20">Cargando historial...</div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
              <MessageSquare className="w-8 h-8" />
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold">No hay mensajes previos</p>
            </div>
          ) : (
            history.map((msg, idx) => (
              <div key={idx} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-brand-ink text-white p-5 rounded-2xl rounded-tr-none shadow-sm relative">
                    <p className="text-sm font-light leading-relaxed">{msg.mensaje}</p>
                    <span className="block text-[8px] mt-2 opacity-40 uppercase tracking-widest">{msg.fecha || "Reciente"}</span>
                  </div>
                </div>
                
                {/* Teacher Response */}
                {msg.respuesta && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white border border-brand-border p-5 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                        <span className="text-[8px] uppercase tracking-[0.2em] font-black text-brand-accent">Respuesta de Cristóbal</span>
                      </div>
                      <p className="text-sm font-light text-brand-ink/80 leading-relaxed italic">{msg.respuesta}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-brand-border bg-white shrink-0">
          <div className="space-y-4">
            <div className="relative">
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hola Cristobal, tengo una duda sobre..."
                className="w-full bg-brand-bg/30 border border-brand-border rounded-xl p-5 text-sm focus:outline-none focus:border-brand-accent transition-all resize-none font-light text-brand-ink/70 min-h-[100px]"
              />
              <button 
                onClick={handleSend}
                disabled={status === "sending" || !message.trim()}
                className={`
                  absolute bottom-4 right-4 p-4 rounded-lg transition-all flex items-center justify-center
                  ${status === "success" ? "bg-emerald-500 text-white" : "bg-brand-accent text-brand-bg hover:scale-105 active:scale-95 disabled:opacity-50"}
                `}
              >
                {status === "sending" ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : status === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
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

function TeacherDashboard({ user, onLogout, onRefresh }: { user: AlumnoData; onLogout: () => void; onRefresh: () => void }) {
  const [activeInnerTab, setActiveInnerTab] = useState<"students" | "messages">("students");
  const [teacherView, setTeacherView] = useState<TeacherViewState>({ mode: "list", selectedStudent: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");

  const students = user.students || [];
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "Todos" || student.classes.some((c: any) => c.tipo === selectedType);
    return matchesSearch && matchesType;
  });

  if (activeInnerTab === "students" && teacherView.mode === "student-detail" && teacherView.selectedStudent) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TeacherNav activeTab={activeInnerTab} onTabChange={setActiveInnerTab} onLogout={onLogout} />
        <TeacherStudentDetail 
          student={teacherView.selectedStudent} 
          onBack={() => setTeacherView({ mode: "list", selectedStudent: null })}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TeacherNav activeTab={activeInnerTab} onTabChange={setActiveInnerTab} onLogout={onLogout} />
      
      {activeInnerTab === "students" ? (
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

          <div className="px-12 py-8 bg-white border-b border-brand-border">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 group">
                <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/20 group-focus-within:text-brand-accent transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar alumno..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-8 py-5 bg-brand-bg/50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-accent transition-all font-light"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-7xl mx-auto px-12 py-16 w-full">
            <div className="space-y-12">
              <div className="flex items-center justify-between border-b border-brand-border pb-6">
                 <h2 className="text-xl font-light tracking-tight flex items-center gap-3 text-brand-ink">
                   <Users className="w-5 h-5 text-brand-accent" />
                   Alumnos en <span className="text-brand-accent italic serif">{selectedType}</span>
                 </h2>
                 <div className="flex items-center gap-6">
                    <button 
                      onClick={onRefresh}
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
                   <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-ink/30">No hay alumnos registrados con estos criterios</p>
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
                         {student.classes.slice(0, 2).map((c: any, cIdx: number) => (
                           <div key={cIdx} className="flex items-center gap-2">
                              <Play className="w-1.5 h-1.5 text-brand-accent" />
                              <span className="text-[9px] uppercase tracking-widest font-medium text-brand-ink/60 truncate">{c.titulo}</span>
                           </div>
                         ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <ManageMessages />
      )}
    </div>
  );
}

function TeacherNav({ activeTab, onTabChange, onLogout }: { activeTab: string; onTabChange: (tab: any) => void; onLogout: () => void }) {
  return (
    <nav className="h-20 border-b border-brand-border px-12 flex items-center justify-between sticky top-0 bg-white z-50">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-ink rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-brand-bg" />
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-[0.3em] font-black text-brand-ink">GALPA CAMPUS</span>
            <span className="block text-[8px] uppercase tracking-widest font-bold text-brand-accent italic">Panel de Instructor</span>
          </div>
        </div>

        <div className="h-8 w-px bg-brand-border"></div>

        <div className="flex gap-2">
            <button 
              onClick={() => onTabChange("students")}
              className={`px-6 py-2 rounded-lg text-[9px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-3 ${activeTab === "students" ? "bg-brand-ink text-white" : "text-brand-ink/40 hover:bg-brand-accent/5 hover:text-brand-accent"}`}
            >
              <Users className="w-4 h-4" />
              Alumnos
            </button>
            <button 
              onClick={() => onTabChange("messages")}
              className={`px-6 py-2 rounded-lg text-[9px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-3 ${activeTab === "messages" ? "bg-brand-ink text-white" : "text-brand-ink/40 hover:bg-brand-accent/5 hover:text-brand-accent"}`}
            >
              <MessageSquare className="w-4 h-4" />
              Mensajes Recibidos
            </button>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="flex items-center gap-3 px-6 py-2 rounded-lg border border-brand-border text-[9px] uppercase tracking-[0.2em] font-bold text-brand-ink/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all group"
      >
        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Desconexión
      </button>
    </nav>
  );
}

function ManageMessages() {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<InternalMessage | null>(null);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");

  const fetchAllMessages = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${SCRIPT_URL}?action=getAllMessages`);
      const data = await resp.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching all messages:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMessages();
  }, []);

  const handleRespond = async () => {
    if (!respondingTo || !responseText.trim()) return;
    setStatus("saving");
    try {
      const url = `${SCRIPT_URL}?action=respondInternalMessage&user=${encodeURIComponent(respondingTo.user)}&mensaje=${encodeURIComponent(respondingTo.mensaje)}&respuesta=${encodeURIComponent(responseText)}`;
      await fetch(url, { method: "POST" });
      setStatus("success");
      setResponseText("");
      setRespondingTo(null);
      await fetchAllMessages();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Error responding:", err);
      setStatus("idle");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 max-w-7xl mx-auto w-full px-12 py-16 space-y-12"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <h2 className="text-5xl font-light tracking-tighter leading-none text-brand-ink">Gestión de <span className="serif text-brand-accent italic">Consultas</span></h2>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-ink/30 italic">Responde a las dudas directas de tus alumnos</p>
        </div>
        <button onClick={fetchAllMessages} className="p-4 rounded-xl bg-white border border-brand-border hover:bg-brand-accent/5 transition-all group">
          <Play className="w-3 h-3 text-brand-ink/20 group-hover:text-brand-accent rotate-90 transition-colors" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[10px] uppercase tracking-[0.2em] font-black text-brand-ink/20 animate-pulse italic">Cargando bandeja de entrada...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {messages.slice().reverse().map((msg, idx) => (
            <div key={idx} className={`p-8 bg-white border rounded-3xl transition-all shadow-sm flex flex-col md:flex-row gap-8 items-start ${msg.respuesta ? "border-brand-border/40 opacity-70" : "border-brand-accent shadow-brand-accent/5 ring-1 ring-brand-accent"}`}>
              <div className="shrink-0 w-32">
                <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center mb-3">
                  <UserIcon className="w-5 h-5 text-brand-ink/20" />
                </div>
                <span className="block text-[11px] font-black text-brand-ink uppercase tracking-wider">{msg.user}</span>
                <span className="block text-[8px] text-brand-ink/30 font-bold uppercase tracking-widest mt-1">{msg.fecha}</span>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-accent">Consulta del alumno:</span>
                  <p className="text-base text-brand-ink/80 font-light leading-relaxed">{msg.mensaje}</p>
                </div>

                {msg.respuesta ? (
                  <div className="p-6 bg-brand-bg rounded-xl border border-brand-border/40">
                    <span className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-ink/30 mb-2 block">Tu respuesta:</span>
                    <p className="text-sm italic text-brand-ink/60 font-light">{msg.respuesta}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea 
                      value={respondingTo?.user === msg.user && respondingTo?.mensaje === msg.mensaje ? responseText : ""}
                      onChange={(e) => {
                        setRespondingTo(msg);
                        setResponseText(e.target.value);
                      }}
                      onFocus={() => setRespondingTo(msg)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full bg-brand-surface border border-brand-border rounded-xl p-5 text-sm focus:border-brand-accent transition-all resize-none h-24 font-light"
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handleRespond}
                        disabled={status === "saving" || !responseText.trim() || respondingTo?.user !== msg.user}
                        className="px-10 py-4 bg-brand-accent text-brand-bg rounded-lg text-[9px] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-xl shadow-brand-accent/20"
                      >
                        {status === "saving" && respondingTo?.user === msg.user ? "Enviando..." : "Enviar Respuesta"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-brand-border rounded-[40px] bg-brand-bg/20">
               <MessageSquare className="w-10 h-10 text-brand-ink/10 mx-auto mb-6" />
               <p className="text-[11px] uppercase tracking-[0.3em] font-black text-brand-ink/20">No se han recibido consultas todavía</p>
            </div>
          )}
        </div>
      )}
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
      <div className="px-12 pt-10 pb-16 border-b border-brand-border bg-brand-accent/[0.03] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-ink/80 hover:text-brand-accent transition-colors mb-8 group"
          >
            <div className="w-8 h-8 rounded-full border border-brand-ink/10 flex items-center justify-center group-hover:border-brand-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Volver al listado
          </button>

          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
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
    tipo: CLASS_TYPES[0],
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
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <div className="space-y-3">
             <label className="text-[9px] uppercase tracking-widest font-black text-brand-ink/40">Categoría / Programa</label>
             <select 
               value={formData.tipo}
               onChange={e => setFormData({...formData, tipo: e.target.value})}
               className="w-full bg-white border border-brand-border rounded-lg p-4 text-sm focus:border-brand-accent text-brand-ink outline-none shadow-sm"
             >
                {CLASS_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
             </select>
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

function DashboardView({ user, onLogout, onContact }: { user: AlumnoData; onLogout: () => void; onContact: (source: string) => void }) {
  const [activeTab, setActiveTab] = useState<string>("Online");
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const isTeacher = user.user.toUpperCase().includes("GALPA");

  const tabs = [
    { id: "Online", label: "Online", enabled: isTeacher || user.online === true },
    { id: "Seminario", label: "Seminario", enabled: isTeacher || user.seminario === true },
    { id: "Webminar", label: "Webminar", enabled: isTeacher || user.webminar === true },
    { id: "Material Exclusivo", label: "Material Exclusivo", enabled: isTeacher || user.materialExclusivo === true },
    { id: "Curso Cuatrimestral", label: "Curso Cuatrimestral", enabled: isTeacher || user.cursoCuatrimestral === true },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const isSubscribed = activeTabData?.enabled;

  const filteredClasses = user.classes.filter(c => {
    if (activeTab === "Online") return c.tipo === "Online" || !c.tipo;
    return c.tipo === activeTab;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-80px)] flex flex-col bg-brand-bg overflow-hidden"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Panel - Fixed */}
        <aside className="w-72 border-r border-brand-border bg-white flex flex-col pt-12 shrink-0">
          <div className="px-8 mb-12">
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-ink/30 mb-6">Mis Programas</h2>
            <nav className="space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-between group ${
                    activeTab === tab.id 
                    ? (tab.enabled ? "bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20" : "bg-brand-ink/10 text-brand-ink/40 shadow-none")
                    : (tab.enabled ? "text-brand-ink/40 hover:bg-brand-accent/5 hover:text-brand-accent" : "text-brand-ink/20 hover:text-brand-ink/30 grayscale contrast-50")
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    <span className={`text-[7px] px-1.5 py-0.5 rounded italic transition-colors ${
                      tab.enabled 
                      ? (activeTab === tab.id ? "bg-white/20 text-white" : "bg-brand-accent/10 text-brand-accent") 
                      : "bg-brand-ink/5 text-brand-ink/40 opacity-60"
                    }`}>
                      {tab.enabled ? "Suscrito" : "No suscrito"}
                    </span>
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${activeTab === tab.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
                </button>
              ))}
            </nav>
          </div>

          <div className="px-8 mt-auto mb-10">
            <button 
              onClick={() => setIsMessageModalOpen(true)}
              className="w-full bg-brand-ink text-white py-4 rounded-lg text-[9px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-3 hover:bg-brand-accent transition-all shadow-xl"
            >
              <MessageSquare className="w-4 h-4" />
              Mis Mensajes
            </button>
          </div>
        </aside>

        {/* Messaging Modal */}
        <InternalMessageModal 
          isOpen={isMessageModalOpen} 
          onClose={() => setIsMessageModalOpen(false)} 
          userName={user.user} 
        />

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Header Panel */}
          <div className="px-12 py-16 border-b border-brand-border bg-brand-accent/[0.02] relative overflow-hidden shrink-0">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10 relative z-10">
              <div className="space-y-4">
                <h1 className="text-5xl font-light tracking-tighter leading-[0.9] text-brand-ink uppercase">
                    Centro de <br/>
                    <span className="serif text-brand-accent italic">Aprendizaje</span>
                </h1>
                <div className="flex items-center gap-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent"></div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-ink/40">
                      Panel de Alumno: <span className="text-brand-ink font-bold">{user.user}</span>
                    </p>
                </div>
              </div>

              <div className="flex gap-12 border-l border-brand-border pl-12 h-16 items-center">
                <div className="space-y-1">
                    <span className="block text-2xl font-light leading-none text-brand-accent">
                      {isSubscribed ? filteredClasses.length : "--"}
                    </span>
                    <span className="block text-[8px] uppercase tracking-widest font-black text-brand-ink/20">{activeTab} Registradas</span>
                </div>
                <div className="space-y-1">
                    <span className="block text-2xl font-light leading-none text-blue-600">AA</span>
                    <span className="block text-[8px] uppercase tracking-widest font-black text-brand-ink/20">Calificación</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-5xl mx-auto px-12 py-16 w-full grid grid-cols-1 gap-16">
              <div className="pb-8 border-b border-brand-border flex items-center justify-between">
                <h3 className="text-[12px] uppercase tracking-[0.4em] font-black text-brand-ink/60">Contenido: {activeTab}</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold text-brand-ink/20">
                   {isSubscribed ? "ORDEN: RECIENTES PRIMERO" : "ACCESO RESTRINGIDO"}
                </div>
              </div>

              {!isSubscribed ? (
                <div className="w-full py-40 border-2 border-dashed border-brand-border bg-white rounded-3xl flex flex-col items-center justify-center gap-10 shadow-sm text-center px-10">
                  <div className="w-20 h-20 bg-brand-ink/5 rounded-full flex items-center justify-center">
                    <Info className="w-10 h-10 text-brand-ink/20" />
                  </div>
                  <div className="space-y-4 max-w-md">
                    <p className="text-[11px] uppercase tracking-[0.4em] font-black text-brand-ink/40">No estás suscrito a esta formación</p>
                    <p className="text-sm text-brand-ink/60 font-light leading-relaxed italic">
                      "Ponte en contacto con tu profesor si quieres suscribirte a esta formación."
                    </p>
                  </div>
                  <button 
                    onClick={() => onContact(`Consulta sobre suscripción: ${activeTab}`)}
                    className="px-10 py-4 bg-brand-accent text-brand-bg rounded-lg text-[9px] uppercase tracking-[0.3em] font-bold hover:scale-105 transition-transform shadow-xl shadow-brand-accent/20"
                  >
                    Contactar ahora
                  </button>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="w-full py-40 border border-brand-border bg-white rounded-2xl flex flex-col items-center justify-center gap-6 shadow-sm">
                  <Info className="w-8 h-8 text-brand-ink/10" />
                  <p className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-ink/20">No se han encontrado registros en esta sección</p>
                </div>
              ) : (
                filteredClasses.slice().reverse().map((clase, idx) => {
                  const originalIdx = user.classes.findIndex(c => c.id === clase.id);
                  return (
                    <ClassCard 
                      key={clase.id || idx} 
                      clase={clase} 
                      index={originalIdx} 
                      userName={user.user} 
                    />
                  );
                })
              )}
          </div>
        </div>
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
