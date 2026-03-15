import React, { useState, useEffect } from 'react';
import { Home, Users, MapPin, Trophy, MessageSquare, CalendarDays, Newspaper, Shirt, ChevronRight, CheckCircle, Calendar, Medal, ThumbsUp, ThumbsDown, ArrowRight, UploadCloud, XCircle, Clock, Building, User, Lock, LogOut, PlusCircle, Info } from 'lucide-react'; // ⬅️ Adicionado 'Info' aqui

// ==========================================
// 1. IMPORTAÇÕES DO FIREBASE
// ==========================================
import { signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import AdminTorneios from './AdminTorneios';

const LOGO_ESCUDO_URL = "https://i.ibb.co/RpB4xKZb/Design-sem-nome.png";
const MEU_EMAIL_ADMIN = "desolafutebolclube@gmail.com"; 
const IMGBB_API_KEY = "c3c7794101dcbe32d9013fcd6c9e1ec6";

// ==========================================
// 🖼️ FOTOS DA ESTRUTURA
// ==========================================
const FOTOS_ESTRUTURA = {
  estadio: "https://i.ibb.co/nMZr3553/Design-sem-nome-1.webp",
  gramado: "https://i.ibb.co/bRqxLz8D/gramado.webp",
  arquibancada: "https://i.ibb.co/Dg5dXZxs/arquibancada.webp",
  vestiario: "https://i.ibb.co/272XXQsd/vestiario.webp",
  camposAnexos: "https://images.unsplash.com/photo-1551280918-62287950c459?q=80&w=600",
  academia: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600",
  medico: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600"
};

// ==========================================
// 2. DADOS SIMULADOS (Mock Data)
// ==========================================
const CLUB_INFO = {
  nome: "De Sola FC",
  fundacao: "Fevereiro 2026",
  tecnico: "Guar-De-Sola",
  estadio: {
    nome: "Estádio Gil Lopes (O Gilzão)",
    capacidade: 40000,
    local: "São Paulo, SP"
  },
  cores: { principal: "#edc515", secundaria: "#000000" },
  competicoes: ["Campeonato Paulista", "Brasileirão Série A"]
};

const INITIAL_PLAYERS = [];

const TROPHIES = [{ id: 1, nome: "Warner Cup", ano: 2026, icone: "🏆" }];

const MOCK_NEWS = [];
const MOCK_TRANSFERS = [];

const MOCK_WARNER_CUP_STANDINGS = [
  { id: 1, pos: 1, time: "De Sola FC", p: 7, j: 4, v: 2, e: 1, d: 1, gp: 4, gc: 4 },
  { id: 2, pos: 2, time: "Beijing Guoan", p: 5, j: 4, v: 1, e: 2, d: 1, gp: 7, gc: 7 },
  { id: 3, pos: 3, time: "Gimnasia-LP", p: 3, j: 3, v: 0, e: 3, d: 0, gp: 5, gc: 5 },
  { id: 4, pos: 4, time: "Gil Vicente", p: 2, j: 3, v: 0, e: 2, d: 1, gp: 2, gc: 4 },
];

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeTournament, setActiveTournament] = useState('paulistao');
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [firebasePlayers, setFirebasePlayers] = useState([]);
  const [formPlayer, setFormPlayer] = useState({
    nome: "", sobrenome: "", grupo: "Goleiros", posicao: "", numero: ""
  });
  const [firebaseNews, setFirebaseNews] = useState([]);
  const [isUploadingNews, setIsUploadingNews] = useState(false);
  const [imageNewsFile, setImageNewsFile] = useState(null);
  const [formNews, setFormNews] = useState({ titulo: "" });
  const [partidasFirebase, setPartidasFirebase] = useState([]);
  const [firebaseTransfers, setFirebaseTransfers] = useState([]);
  const [isUploadingTransfer, setIsUploadingTransfer] = useState(false);
  const [imageTransferFile, setImageTransferFile] = useState(null);
  const [formTransfer, setFormTransfer] = useState({
    tipo: 'CHEGADA', 
    jogador: '',
    posicao: '',
    clubeEnvolvido: '', 
    valor: ''
  });

  // 👇 ESTADO DO MODAL DE AVISO 👇
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // ----------------------------------------------------
  // EFEITO DO MODAL DE AVISO
  // ----------------------------------------------------
  useEffect(() => {
    // Verifica na memória do navegador se a pessoa já clicou em "Ciente" antes
    const hasSeenDisclaimer = localStorage.getItem('desola_aviso_lido');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleCloseDisclaimer = () => {
    localStorage.setItem('desola_aviso_lido', 'true');
    setShowDisclaimer(false);
  };

  // ----------------------------------------------------
  // EFEITO DE AUTO-SCROLL (Rolar para o jogo atual)
  // ----------------------------------------------------
  useEffect(() => {
    // Só rola a tela se estiver na home e se o aviso NÃO estiver na tela
    if (activeTab === 'home' && !showDisclaimer) {
      const timer = setTimeout(() => {
        const elementoProximoJogo = document.getElementById('proxima-partida');
        const container = document.getElementById('container-partidas'); 
        
        if (elementoProximoJogo && container) {
          const posicaoScroll = elementoProximoJogo.offsetLeft - (container.clientWidth / 2) + (elementoProximoJogo.clientWidth / 2);
          
          container.scrollTo({ left: posicaoScroll, behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, partidasFirebase, showDisclaimer]);

  // ----------------------------------------------------
  // EFEITOS (Conexões com o Firebase)
  // ----------------------------------------------------
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Erro no login anónimo:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const unsubscribeComments = onSnapshot(collection(db, 'comentarios'), (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedComments.sort((a, b) => b.timestamp - a.timestamp);
      setComments(fetchedComments);
      setLoadingComments(false);
    });

    const unsubscribePlayers = onSnapshot(collection(db, 'jogadores'), (snapshot) => {
      const fetchedPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedPlayers.sort((a, b) => a.numero - b.numero);
      setFirebasePlayers(fetchedPlayers);
    });

    const unsubscribeNews = onSnapshot(collection(db, 'noticias'), (snapshot) => {
      const fetchedNews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedNews.sort((a, b) => b.timestamp - a.timestamp); 
      setFirebaseNews(fetchedNews);
    });

    const unsubscribePartidas = onSnapshot(collection(db, 'partidas'), (snapshot) => {
      const fetchedPartidas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartidasFirebase(fetchedPartidas);
    });

    const unsubscribeTransfers = onSnapshot(collection(db, 'transferencias'), (snapshot) => {
      const fetchedTransfers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedTransfers.sort((a, b) => b.timestamp - a.timestamp); 
      setFirebaseTransfers(fetchedTransfers);
    });

    return () => {
      unsubscribeComments();
      unsubscribePlayers();
      unsubscribeNews();
      unsubscribePartidas();
      unsubscribeTransfers();
    };
  }, [user]);

  // ----------------------------------------------------
  // FUNÇÕES DE AÇÃO
  // ----------------------------------------------------
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim() === "" || !user || !db) return;
    
    let formatHandle = newHandle.trim() === "" ? "Visitante" : newHandle.trim();
    if (formatHandle !== "Visitante" && !formatHandle.startsWith('@')) formatHandle = `@${formatHandle}`;
    
    const avatarName = formatHandle.replace(/[@_.]/g, '');

    try {
      await addDoc(collection(db, 'comentarios'), {
        autor: formatHandle,
        texto: newComment,
        data: new Date().toLocaleDateString('pt-BR'),
        avatar: `https://ui-avatars.com/api/?name=${avatarName || 'V'}&background=edc515&color=000&rounded=true&bold=true`,
        timestamp: Date.now()
      });
      setNewComment(""); setNewHandle("");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setLoginError("Ocorreu um erro ao tentar fazer login com o Google.");
    }
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('home'); 
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!formPlayer.nome || !formPlayer.sobrenome || !formPlayer.posicao || !formPlayer.numero || !imageFile) {
      alert("Preencha todos os campos e selecione a foto!");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      const imgData = await res.json();
      if (!imgData.success) throw new Error("Erro no ImgBB");

      await addDoc(collection(db, 'jogadores'), {
        nome: formPlayer.nome,
        sobrenome: formPlayer.sobrenome.toUpperCase(),
        grupo: formPlayer.grupo,
        posicao: formPlayer.posicao,
        numero: parseInt(formPlayer.numero),
        img: imgData.data.url, 
        timestamp: Date.now()
      });
      
      setFormPlayer({ nome: "", sobrenome: "", grupo: "Goleiros", posicao: "", numero: "" });
      setImageFile(null);
      document.getElementById("file-upload").value = "";
      alert("Jogador adicionado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar jogador.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!formNews.titulo || !imageNewsFile) {
      alert("Preencha o título e selecione a foto da notícia!");
      return;
    }
    setIsUploadingNews(true);
    try {
      const formData = new FormData();
      formData.append('image', imageNewsFile);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      const imgData = await res.json();
      if (!imgData.success) throw new Error("Erro no ImgBB");

      await addDoc(collection(db, 'noticias'), {
        titulo: formNews.titulo,
        img: imgData.data.url, 
        timestamp: Date.now()
      });
      
      setFormNews({ titulo: "" });
      setImageNewsFile(null);
      document.getElementById("news-file-upload").value = "";
      alert("Notícia publicada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar notícia.");
    } finally {
      setIsUploadingNews(false);
    }
  };

  const handleAddTransfer = async (e) => {
    e.preventDefault();
    if (!formTransfer.jogador || !formTransfer.clubeEnvolvido || !formTransfer.valor || !imageTransferFile) {
      alert("Preencha todos os campos e selecione a foto do jogador!");
      return;
    }
    
    setIsUploadingTransfer(true);
    try {
      const formData = new FormData();
      formData.append('image', imageTransferFile);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const imgData = await res.json();
      if (!imgData.success) throw new Error("Erro no ImgBB");

      const de = formTransfer.tipo === 'CHEGADA' ? formTransfer.clubeEnvolvido : 'De Sola FC';
      const para = formTransfer.tipo === 'CHEGADA' ? 'De Sola FC' : formTransfer.clubeEnvolvido;

      await addDoc(collection(db, 'transferencias'), {
        jogador: formTransfer.jogador,
        posicao: formTransfer.posicao,
        tipo: formTransfer.tipo,
        de: de,
        para: para,
        valor: formTransfer.valor,
        img: imgData.data.url,
        timestamp: Date.now()
      });
      
      setFormTransfer({ tipo: 'CHEGADA', jogador: '', posicao: '', clubeEnvolvido: '', valor: '' });
      setImageTransferFile(null);
      document.getElementById("transfer-file-upload").value = "";
      alert("Transferência registrada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar transferência.");
    } finally {
      setIsUploadingTransfer(false);
    }
  };

  const getTabelaPaulistao = () => {
    const TIMES_PAULISTAO = [
      "De Sola FC", "Palmeiras", "São Paulo", "Corinthians", "Bragantino",
      "Santos", "Primavera", "Mirassol", "São Bernardo", "Novorizontino",
      "Botafogo-SP", "Ponte Preta", "Guarani", "Ituano", "Ferroviária", "Inter de Limeira"
    ];

    let tabela = TIMES_PAULISTAO.map(time => ({
      time: time, p: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0
    }));

    partidasFirebase.forEach(jogo => {
      if (jogo.golsC !== null && jogo.golsF !== null) {
        const casa = tabela.find(t => t.time === jogo.timeC);
        const fora = tabela.find(t => t.time === jogo.timeF);

        if (casa && fora) {
          casa.j += 1; 
          fora.j += 1;
          casa.gp += jogo.golsC; 
          casa.gc += jogo.golsF;
          fora.gp += jogo.golsF; 
          fora.gc += jogo.golsC;

          if (jogo.golsC > jogo.golsF) {
            casa.p += 3; casa.v += 1; fora.d += 1;
          } else if (jogo.golsC < jogo.golsF) {
            fora.p += 3; fora.v += 1; casa.d += 1;
          } else {
            casa.p += 1; fora.p += 1; casa.e += 1; fora.e += 1; 
          }
        }
      }
    });

    tabela.sort((a, b) => {
      if (b.p !== a.p) return b.p - a.p; 
      if (b.v !== a.v) return b.v - a.v; 
      const saldoA = a.gp - a.gc;
      const saldoB = b.gp - b.gc;
      if (saldoB !== saldoA) return saldoB - saldoA; 
      return b.gp - a.gp; 
    });

    return tabela.map((t, index) => ({ ...t, id: index + 1, pos: index + 1 }));
  };

  // ==========================================
  // 4. TELAS DO APLICATIVO
  // ==========================================

  const renderHome = () => {
    const jogosDoDeSola = [...partidasFirebase]
      .filter(p => p.timeC === 'De Sola FC' || p.timeF === 'De Sola FC')
      .sort((a, b) => a.timestamp - b.timestamp);

    const proximaPartidaIndex = jogosDoDeSola.findIndex(p => p.golsC === null);
    const proximoJogo = proximaPartidaIndex !== -1 ? jogosDoDeSola[proximaPartidaIndex] : null;

    return (
      <div className="space-y-12 animate-fadeIn">
        
        {/* BARRA DE TOPO DINÂMICA */}
        {proximoJogo ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex flex-col text-center md:text-left">
              <span className="text-zinc-400 text-xs uppercase font-bold tracking-wider">
                {proximoJogo.campeonato || "Paulistão"} • {proximoJogo.rodada} • {proximoJogo.estadio || "A definir"}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-4 md:gap-8 text-xl font-bold w-full md:w-auto">
              <span className={`hidden sm:block ${proximoJogo.timeC === 'De Sola FC' ? 'text-white' : 'text-zinc-400'}`}>
                {proximoJogo.timeC}
              </span>
              <span className={`sm:hidden ${proximoJogo.timeC === 'De Sola FC' ? 'text-white' : 'text-zinc-400'}`}>
                {proximoJogo.timeC === 'De Sola FC' ? 'DSFC' : proximoJogo.timeC.substring(0,3).toUpperCase()}
              </span>
              
              <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-[#edc515]">
                16:00
              </div>
              
              <span className={`hidden sm:block ${proximoJogo.timeF === 'De Sola FC' ? 'text-white' : 'text-zinc-400'}`}>
                {proximoJogo.timeF}
              </span>
              <span className={`sm:hidden ${proximoJogo.timeF === 'De Sola FC' ? 'text-white' : 'text-zinc-400'}`}>
                {proximoJogo.timeF === 'De Sola FC' ? 'DSFC' : proximoJogo.timeF.substring(0,3).toUpperCase()}
              </span>
            </div>

            <a 
              href="https://www.youtube.com/@DeSolaOficial" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#edc515] hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition text-sm w-full md:w-auto text-center"
            >
              Assistir
            </a>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-center shadow-lg">
            <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Sem jogos agendados no momento</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="relative w-full h-[300px] md:aspect-video lg:aspect-auto bg-zinc-800 rounded-xl overflow-hidden group cursor-pointer lg:min-h-[350px]">
            <div className="absolute inset-0 bg-[url('https://i.ibb.co/nMZr3553/Design-sem-nome-1.webp')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            <h2 className="absolute bottom-6 left-6 right-6 text-xl md:text-3xl font-black text-white group-hover:text-[#edc515] transition-colors leading-tight break-words">
              Torcedores preparam grande festa no Gilzão para o próximo duelo.
            </h2>
          </div>
          <div className="w-full bg-zinc-900 p-6 md:p-8 lg:p-12 rounded-xl flex flex-col justify-center border border-zinc-800 hover:border-[#edc515]/30 transition-colors cursor-pointer group shadow-lg">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 group-hover:text-[#edc515] transition-colors break-words">
              De Sola <br/><span className="text-zinc-400 text-2xl md:text-3xl lg:text-4xl">em busca da classificação no Paulistão</span>
            </h2>
            <p className="text-zinc-400 text-base md:text-lg">A equipe comandada por Guar-De-Sola se prepara para mais um confronto diante da sua torcida na próxima sexta-feira no Estádio Gil Lopes.</p>
          </div>
        </div>

        {/* Notícias */}
        <div>
          <div className="flex justify-between items-end mb-6"><h3 className="text-3xl font-bold text-white">Últimas Notícias</h3></div>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {[...firebaseNews, ...MOCK_NEWS].map((news, index) => (
              <div key={news.id || `mock-${index}`} className="w-[85vw] sm:w-[280px] lg:w-[23%] shrink-0 snap-start cursor-pointer group">
                <div className="aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-4 relative">
                  <img src={news.img} alt={news.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#edc515] transition-colors rounded-xl pointer-events-none"></div>
                </div>
                <h3 className="text-white font-bold text-lg group-hover:text-[#edc515] transition-colors leading-snug">{news.titulo}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Partidas (Linha do Tempo) */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-3xl font-bold text-white">Partidas</h3>
          </div>
          <div id="container-partidas" className="w-full flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] px-4 md:px-0 relative">
            
            {jogosDoDeSola.length === 0 ? (
              <p className="text-zinc-500 italic">Nenhum jogo agendado ainda. Vá na aba Admin para criar a primeira rodada.</p>
            ) : (
              jogosDoDeSola.map((match, index) => {
                const isProxima = index === proximaPartidaIndex; 
                const isPassada = match.golsC !== null; 

                return (
                  <div 
                    key={match.id} 
                    id={isProxima ? 'proxima-partida' : `partida-${match.id}`}
                    className={`min-w-[300px] md:min-w-[340px] bg-zinc-900 border rounded-2xl p-6 snap-center shrink-0 cursor-pointer flex flex-col justify-between transition-all duration-300
                      ${isProxima ? 'border-[#edc515] shadow-[0_0_20px_rgba(237,197,21,0.15)] scale-[1.02] z-10' : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-[#edc515]/50'}`
                    }
                  >
                    <div>
                      <div className="mb-4">
                        {isProxima && <span className="bg-[#edc515] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">Próxima Partida</span>}
                        {isPassada && <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">Fim de Jogo</span>}
                        {(!isProxima && !isPassada) && <span className="bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">A Realizar</span>}
                      </div>

                      <div className="flex justify-between items-center mb-6">
                        <span className={`font-bold text-lg w-24 truncate ${match.timeC === 'De Sola FC' ? 'text-[#edc515]' : 'text-white'}`}>{match.timeC}</span>
                        
                        <div className="flex gap-2 items-center text-2xl font-black">
                          {isPassada ? (
                            <>
                              <span className="text-white">{match.golsC}</span>
                              <span className="text-zinc-600 text-sm font-bold">X</span>
                              <span className="text-white">{match.golsF}</span>
                            </>
                          ) : (
                            <span className="text-zinc-600 text-sm font-bold opacity-50">VS</span>
                          )}
                        </div>

                        <span className={`font-bold text-lg w-24 text-right truncate ${match.timeF === 'De Sola FC' ? 'text-[#edc515]' : 'text-white'}`}>{match.timeF}</span>
                      </div>
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Equipa Principal</div>
                      <h4 className={`font-bold text-xl mb-1 ${isProxima ? 'text-[#edc515]' : 'text-zinc-300'}`}>{match.campeonato || 'Paulistão'}</h4>
                      <p className="text-zinc-400 text-sm mb-6">{match.rodada}</p>
                    </div>
                    <div className="pt-4 border-t border-zinc-800 flex items-center gap-3 text-zinc-400 text-sm">
                      <MapPin size={16} className={isProxima ? "text-[#edc515]" : "text-zinc-600"} />
                      <span className="truncate">{match.estadio || "A Definir"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Vai e Vem */}
        <div>
          <div className="flex justify-between items-end mb-6"><h3 className="text-3xl font-bold text-white flex items-center gap-3">Vai e Vem do Mercado</h3></div>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {(firebaseTransfers.length > 0 ? firebaseTransfers : MOCK_TRANSFERS).map(transfer => {
  
              const escudoDeRender = transfer.escudoDe || `https://ui-avatars.com/api/?name=${transfer.de.charAt(0)}&background=${transfer.de === 'De Sola FC' ? 'edc515' : '333'}&color=${transfer.de === 'De Sola FC' ? '000' : 'fff'}&rounded=true&bold=true`;
              const escudoParaRender = transfer.escudoPara || `https://ui-avatars.com/api/?name=${transfer.para.charAt(0)}&background=${transfer.para === 'De Sola FC' ? 'edc515' : '333'}&color=${transfer.para === 'De Sola FC' ? '000' : 'fff'}&rounded=true&bold=true`;

              return (
                <div key={transfer.id} className="min-w-[280px] w-[280px] bg-zinc-900 border border-zinc-800 hover:border-[#edc515]/50 transition-colors rounded-2xl overflow-hidden snap-start flex flex-col relative group shadow-lg">
                  <Shirt className="absolute -right-8 -top-8 text-zinc-800/30 w-48 h-48 -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-500" />
                  <div className="p-5 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded border border-zinc-800">
                          <img src={escudoDeRender} alt={transfer.de} className="w-4 h-4 rounded-full border border-zinc-700 object-cover" />
                          <span className="text-zinc-500 truncate max-w-[50px]">{transfer.de}</span>
                          <ArrowRight size={12} className="text-[#edc515] mx-0.5" />
                          <img src={escudoParaRender} alt={transfer.para} className="w-4 h-4 rounded-full border border-[#edc515]/50 object-cover" />
                          <span className="text-white truncate max-w-[50px]">{transfer.para}</span>
                        </div>
                      </div>
                      <div className={`${transfer.tipo === 'CHEGADA' ? 'bg-[#edc515] text-black' : 'bg-zinc-700 text-white'} text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-full shadow-lg shrink-0`}>
                        {transfer.tipo}
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-white leading-tight mb-1">{transfer.jogador}</h4>
                    <p className="text-[#edc515] text-xs font-bold uppercase tracking-wider mb-2">{transfer.posicao}</p>
                  </div>
                  <div className="relative h-40 w-full bg-zinc-800 z-10 border-y border-zinc-800 overflow-hidden">
                    <img src={transfer.img} alt={transfer.jogador} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">Vídeo / Lances</div>
                  </div>
                  <div className="p-5 z-10 flex-grow">
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">{transfer.tipo === 'CHEGADA' ? 'Novo Reforço' : 'Deixou o Clube'}</p>
                    <p className="text-white font-medium text-sm leading-snug">{transfer.valor}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 flex justify-end items-center z-10 border-t border-zinc-800">
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-red-500/20"><ThumbsDown size={14} /></button>
                      <button className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors border border-green-500/20"><ThumbsUp size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderElenco = () => {
    const grupos = ["Goleiros", "Defensores", "Meio-campistas", "Atacantes"];
    const todosOsJogadores = [...INITIAL_PLAYERS, ...firebasePlayers];

    return (
      <div className="space-y-12">
        <div className="bg-zinc-900 border border-[#edc515]/30 p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-sm font-bold text-[#edc515] uppercase tracking-widest mb-1">Equipe Técnica</h3>
            <h2 className="text-3xl font-black text-white">{CLUB_INFO.tecnico}</h2>
            <p className="text-zinc-400 mt-2">Treinador Principal • Preparando a equipe para a glória no Paulistão</p>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#edc515]/20 shrink-0">
            <img src="https://i.ibb.co/4ZfyFzby/5950-1603706955.webp" alt={CLUB_INFO.tecnico} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="space-y-12 mt-8">
          {grupos.map(grupo => {
            const lista = todosOsJogadores.filter(j => j.grupo === grupo);
            if (lista.length === 0) return null;

            return (
              <div key={grupo} className="animate-fadeIn">
                <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-[#edc515] rounded-sm block"></span>{grupo}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
                  {lista.map((jogador, idx) => (
                    <div key={jogador.id || idx} className="bg-zinc-900 border border-zinc-800 relative group overflow-hidden flex flex-col rounded-sm hover:border-[#edc515]/50 transition-all cursor-pointer shadow-md hover:shadow-xl hover:shadow-[#edc515]/5">
                      <div className="absolute top-2 left-3 text-4xl md:text-5xl font-black text-white/10 group-hover:text-[#edc515]/80 transition-colors z-10 pointer-events-none">{jogador.numero}</div>
                      <div className="aspect-[3/4] overflow-hidden bg-zinc-800/50">
                        <img src={jogador.img} alt={jogador.nome} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0" />
                      </div>
                      <div className="p-4 bg-zinc-950 border-t border-zinc-800 group-hover:border-[#edc515] transition-colors relative z-20 flex-grow flex flex-col justify-end">
                        <p className="text-xs text-zinc-400 font-medium mb-0.5">{jogador.nome}</p>
                        <h4 className="text-lg md:text-xl font-black text-white uppercase leading-none mb-1.5 tracking-wide">{jogador.sobrenome}</h4>
                        <p className="text-[11px] md:text-xs text-[#edc515] font-bold uppercase tracking-wider">{jogador.posicao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEstrutura = () => (
    <div className="space-y-16 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative group cursor-pointer">
        <div className="h-80 md:h-[450px] overflow-hidden">
          <img src={FOTOS_ESTRUTURA.estadio} alt="Fachada do Estádio" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
          <h2 className="text-4xl md:text-6xl font-black text-[#edc515] uppercase tracking-wide mb-4 drop-shadow-lg">{CLUB_INFO.estadio.nome}</h2>
          <div className="flex flex-wrap gap-4 md:gap-8 text-sm md:text-base font-bold uppercase tracking-wider text-zinc-300">
            <span className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-zinc-700/50"><MapPin size={20} className="text-[#edc515]" /> {CLUB_INFO.estadio.local}</span>
            <span className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-zinc-700/50"><Users size={20} className="text-[#edc515]" /> {CLUB_INFO.estadio.capacidade.toLocaleString()} Torcedores</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-3">
          <span className="w-2 h-8 bg-[#edc515] rounded-sm block"></span> Por dentro do Gilzão
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
            <div className="h-48 overflow-hidden"><img src={FOTOS_ESTRUTURA.gramado} alt="Gramado" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="p-4 bg-zinc-950"><h4 className="text-white font-bold text-lg">Gramado Padrão FIFA</h4><p className="text-zinc-500 text-sm mt-1">Um verdadeiro tapete para o estilo de jogo do De Sola.</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
            <div className="h-48 overflow-hidden"><img src={FOTOS_ESTRUTURA.arquibancada} alt="Arquibancada" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="p-4 bg-zinc-950"><h4 className="text-white font-bold text-lg">Setor da Torcida Organizada</h4><p className="text-zinc-500 text-sm mt-1">Setor sem cadeiras, o coração da arquibancada que empurra o time.</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
            <div className="h-48 overflow-hidden relative"><div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div><img src={FOTOS_ESTRUTURA.vestiario} alt="Vestiário" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="p-4 bg-zinc-950"><h4 className="text-white font-bold text-lg">Vestiário Principal</h4><p className="text-zinc-500 text-sm mt-1">Onde as preleções históricas do Guar-De-Sola acontecem.</p></div>
          </div>
        </div>
      </div>

      {/* <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-3">
          <span className="w-2 h-8 bg-[#edc515] rounded-sm block"></span> Centro de Treinamento (CT)
        </h3>
        <p className="text-zinc-400">Estrutura de ponta para preparar os nossos craques para os maiores desafios da temporada.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
            <div className="h-48 overflow-hidden"><img src={FOTOS_ESTRUTURA.camposAnexos} alt="Campos de Treino" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="p-4 bg-zinc-950"><h4 className="text-[#edc515] font-bold text-lg">Campos Anexos</h4><p className="text-zinc-500 text-sm mt-1">Três campos com dimensões oficiais para trabalhos táticos.</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
            <div className="h-48 overflow-hidden"><img src={FOTOS_ESTRUTURA.academia} alt="Academia" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="p-4 bg-zinc-950"><h4 className="text-[#edc515] font-bold text-lg">Academia de Alta Performance</h4><p className="text-zinc-500 text-sm mt-1">Equipamentos de última geração para o preparo físico.</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
            <div className="h-48 overflow-hidden"><img src={FOTOS_ESTRUTURA.medico} alt="Departamento Médico" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            <div className="p-4 bg-zinc-950"><h4 className="text-[#edc515] font-bold text-lg">Departamento Médico</h4><p className="text-zinc-500 text-sm mt-1">Estrutura completa com centro de recuperação e fisioterapia avançada.</p></div>
          </div>
        </div>
      </div> */}
    </div>
  );

  const renderTrofeus = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Trophy className="text-[#edc515]" size={32} /> Galeria de Troféus</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {TROPHIES.map(trofeu => (
          <div key={trofeu.id} className="bg-zinc-900 border border-[#edc515]/50 p-8 rounded-xl flex flex-col items-center text-center transform transition hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(237,197,21,0.2)]">
            <span className="text-6xl mb-4 drop-shadow-lg">{trofeu.icone}</span>
            <h3 className="text-xl font-bold text-white">{trofeu.nome}</h3>
            <p className="text-[#edc515] font-medium mt-2">Campeão - {trofeu.ano}</p>
          </div>
        ))}
        <div className="bg-zinc-950 border-2 border-dashed border-zinc-800 p-8 rounded-xl flex flex-col items-center justify-center text-center opacity-50">
          <Trophy className="text-zinc-700 mb-4" size={48} />
          <p className="text-zinc-500 font-medium">Espaço reservado para o Brasileirão</p>
        </div>
      </div>
    </div>
  );

  const renderTorcida = () => (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-10 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-[#edc515] mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="flex items-center gap-3"><MessageSquare /> Voz da Torcida</span>
        </h2>
        
        <form onSubmit={handleAddComment} className="mb-10 bg-zinc-950 p-6 md:p-8 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 shrink-0">
              <User size={24} />
            </div>
            <input type="text" value={newHandle} onChange={(e) => setNewHandle(e.target.value)} placeholder="Seu @ (ex: @certezas)" className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-4 text-white focus:outline-none focus:border-[#edc515] transition-colors text-lg" />
          </div>
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Deixe sua mensagem de apoio ao time..." className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-5 text-white focus:outline-none focus:border-[#edc515] resize-none h-32 mb-6 transition-colors text-lg" />
          <div className="flex justify-end">
            <button type="submit" className="bg-[#edc515] hover:bg-yellow-500 text-black font-bold py-3 px-10 rounded-md transition text-lg shadow-[0_0_10px_rgba(237,197,21,0.2)] hover:shadow-[0_0_15px_rgba(237,197,21,0.4)]">Enviar Mensagem</button>
          </div>
        </form>

        <div className="space-y-5">
          {loadingComments ? (
             <div className="text-center text-[#edc515] py-10 animate-pulse font-medium">A carregar mensagens do servidor...</div>
          ) : comments.length === 0 ? (
             <div className="text-center text-zinc-500 py-10 border border-dashed border-zinc-800 rounded-lg">Seja o primeiro a deixar uma mensagem de apoio ao De Sola!</div>
          ) : (
            comments.map(comentario => (
              <div key={comentario.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg flex gap-5 hover:border-zinc-700 transition-colors">
                <img src={comentario.avatar} alt={comentario.autor} className="w-14 h-14 rounded-full border border-[#edc515]/30 shrink-0 object-cover" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-1">
                    <span className="font-bold text-[#edc515] text-xl leading-none">{comentario.autor}</span>
                    <span className="text-sm text-zinc-500 flex items-center gap-1"><Clock size={14} /> {comentario.data}</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-lg">{comentario.texto}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderTorneios = () => {
    let currentData = [];
    let titulo = "";
    let subtitulo = "";

    if (activeTournament === 'paulistao') {
      currentData = getTabelaPaulistao();
      titulo = "Classificação Geral - Paulistão 2026";
      subtitulo = "Jornada 8";
    } else if (activeTournament === 'warner') {
      currentData = MOCK_WARNER_CUP_STANDINGS;
      titulo = "Classificação Final - Warner Cup 2026";
      subtitulo = "Torneio Concluído (De Sola FC Campeão 🏆)";
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Medal className="text-[#edc515]" size={32} /> Competições</h2>
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTournament('paulistao')} className={`font-bold py-2 px-4 rounded-md text-sm transition whitespace-nowrap ${activeTournament === 'paulistao' ? 'bg-[#edc515] text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Paulistão</button>
            <button onClick={() => setActiveTournament('warner')} className={`font-bold py-2 px-4 rounded-md text-sm transition whitespace-nowrap ${activeTournament === 'warner' ? 'bg-[#edc515] text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Warner Cup</button>
            <button onClick={() => setActiveTournament('brasileirao')} className={`font-bold py-2 px-4 rounded-md text-sm transition whitespace-nowrap ${activeTournament === 'brasileirao' ? 'bg-[#edc515] text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Brasileirão Série A</button>
          </div>
        </div>

        {activeTournament === 'brasileirao' ? (
          <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 p-12 rounded-xl flex flex-col items-center justify-center text-center opacity-70">
            <Calendar className="text-zinc-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white">Competição ainda não iniciada</h3>
            <p className="text-zinc-400 mt-2">O Brasileirão Série A começará em breve. Fica atento!</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg animate-fadeIn">
            <div className="bg-zinc-950 p-5 border-b border-zinc-800 flex justify-between items-center">
              <div><h3 className="text-xl font-bold text-white">{titulo}</h3><p className="text-[#edc515] text-sm mt-1 font-medium">{subtitulo}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <th className="p-4 w-12 text-center">Pos</th><th className="p-4">Clube</th><th className="p-4 text-center font-bold text-white">P</th><th className="p-4 text-center">J</th><th className="p-4 text-center">V</th><th className="p-4 text-center">E</th><th className="p-4 text-center">D</th><th className="p-4 text-center hidden sm:table-cell">GM</th><th className="p-4 text-center hidden sm:table-cell">GS</th><th className="p-4 text-center">DG</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {currentData.map((equipa, index) => (
                    <tr key={equipa.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/80 transition-colors ${equipa.time === "De Sola FC" ? "bg-[#edc515]/10" : ""}`}>
                      <td className="p-4 text-center"><span className={`flex items-center justify-center w-6 h-6 rounded-full mx-auto text-xs font-bold ${activeTournament === 'paulistao' && index < 8 ? "bg-blue-500/20 text-blue-400" : ""} ${activeTournament === 'paulistao' && index >= 14 ? "bg-red-500/20 text-red-400" : ""} ${activeTournament === 'warner' && index === 0 ? "bg-[#edc515] text-black shadow-[0_0_10px_rgba(237,197,21,0.5)]" : ""} ${(activeTournament === 'paulistao' && index >= 8 && index < 14) || (activeTournament === 'warner' && index > 0) ? "text-zinc-500" : ""}`}>{equipa.pos}</span></td>
                      <td className="p-4"><div className="flex items-center gap-3"><span className={equipa.time === "De Sola FC" ? "text-[#edc515] font-bold text-base" : "text-zinc-300 font-medium"}>{equipa.time}</span></div></td>
                      <td className="p-4 text-center font-bold text-white text-base">{equipa.p}</td><td className="p-4 text-center text-zinc-400">{equipa.j}</td><td className="p-4 text-center text-zinc-400">{equipa.v}</td><td className="p-4 text-center text-zinc-400">{equipa.e}</td><td className="p-4 text-center text-zinc-400">{equipa.d}</td><td className="p-4 text-center text-zinc-400 hidden sm:table-cell">{equipa.gp}</td><td className="p-4 text-center text-zinc-400 hidden sm:table-cell">{equipa.gc}</td>
                      <td className="p-4 text-center text-zinc-400 font-medium">{equipa.gp - equipa.gc > 0 ? `+${equipa.gp - equipa.gc}` : equipa.gp - equipa.gc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activeTournament === 'paulistao' && (
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap gap-6 text-xs text-zinc-400 font-medium"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/50"></div><span>Fase Final (Top 8)</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div><span>Despromoção</span></div></div>
            )}
            {activeTournament === 'warner' && (
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap gap-6 text-xs text-zinc-400 font-medium"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#edc515] shadow-[0_0_8px_rgba(237,197,21,0.5)]"></div><span className="text-[#edc515]">Grande Campeão</span></div></div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAdmin = () => {
    const isAdmin = user && !user.isAnonymous;

    if (!isAdmin) {
      return (
        <div className="max-w-md mx-auto mt-20 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl animate-fadeIn">
          <div className="text-center mb-8">
            <Lock className="mx-auto text-[#edc515] mb-4" size={48} />
            <h2 className="text-2xl font-black text-white">Acesso Restrito</h2>
            <p className="text-zinc-400 mt-2">Faça login com a sua conta Google corporativa da Diretoria do De Sola FC</p>
          </div>
          
          {loginError && <div className="bg-red-500/20 text-red-500 border border-red-500/50 p-3 rounded text-center text-sm mb-4">{loginError}</div>}
          
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded hover:bg-gray-100 transition shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com o Google
          </button>
        </div>
      );
    }

    if (user.email !== MEU_EMAIL_ADMIN) {
      return (
        <div className="max-w-md mx-auto mt-20 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl text-center animate-fadeIn">
          <XCircle className="mx-auto text-red-500 mb-4" size={56} />
          <h2 className="text-2xl font-black text-white">Acesso Negado</h2>
          <p className="text-zinc-400 mt-2">A conta <strong className="text-white">{user.email}</strong> não tem permissões de Diretoria neste sistema.</p>
          <button onClick={handleAdminLogout} className="mt-8 bg-zinc-800 text-white font-bold py-3 px-8 rounded hover:bg-zinc-700 transition w-full">
            Sair e voltar ao site
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-zinc-900 border border-[#edc515] p-6 rounded-xl flex justify-between items-center shadow-[0_0_20px_rgba(237,197,21,0.1)]">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              Painel da Diretoria <CheckCircle className="text-green-500" size={24} />
            </h2>
            <p className="text-zinc-400">Logado de forma segura como: <span className="text-[#edc515] font-bold">{user.email}</span></p>
          </div>
          <button onClick={handleAdminLogout} className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded text-zinc-400 hover:text-red-500 hover:border-red-500 transition">
            <LogOut size={18} /> Trancar Cofre
          </button>
        </div>

        <AdminTorneios />

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg mt-8">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2">
            <PlusCircle className="text-[#edc515]"/> Contratar Novo Jogador
          </h3>
          
          <form onSubmit={handleAddPlayer} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Nome de Apresentação (Pequeno)</label>
                <input type="text" value={formPlayer.nome} onChange={e => setFormPlayer({...formPlayer, nome: e.target.value})} placeholder="Ex: Casimiro" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-[#edc515]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Sobrenome da Camisa (Grande)</label>
                <input type="text" value={formPlayer.sobrenome} onChange={e => setFormPlayer({...formPlayer, sobrenome: e.target.value})} placeholder="Ex: MIGUEL" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-[#edc515]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Posição (Detalhada)</label>
                <input type="text" value={formPlayer.posicao} onChange={e => setFormPlayer({...formPlayer, posicao: e.target.value})} placeholder="Ex: Centroavante" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-[#edc515]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Número da Camisa</label>
                <input type="number" value={formPlayer.numero} onChange={e => setFormPlayer({...formPlayer, numero: e.target.value})} placeholder="Ex: 9" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-[#edc515]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Grupo no Elenco</label>
                <select value={formPlayer.grupo} onChange={e => setFormPlayer({...formPlayer, grupo: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-[#edc515]">
                  <option value="Goleiros">Goleiros</option>
                  <option value="Defensores">Defensores</option>
                  <option value="Meio-campistas">Meio-campistas</option>
                  <option value="Atacantes">Atacantes</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1 flex items-center gap-2">
                  <UploadCloud size={16} className="text-[#edc515]"/> Foto do Jogador
                </label>
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setImageFile(e.target.files[0])} 
                  disabled={isUploading}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#edc515] file:text-black file:font-bold cursor-pointer" 
                />
                <p className="mt-2 text-[10px] text-zinc-500">💡 Use fotos verticais (600x800px).</p>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isUploading} 
              className="w-full md:w-auto bg-[#edc515] text-black font-black py-4 px-8 rounded hover:bg-yellow-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? "ENVIANDO IMAGEM..." : "ANUNCIAR CONTRATAÇÃO"}
            </button>
          </form>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg mt-8">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2">
            <Newspaper className="text-[#edc515]"/> Publicar Nova Notícia
          </h3>
          
          <form onSubmit={handleAddNews} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-zinc-400 text-sm mb-1">Título da Notícia</label>
                <input type="text" value={formNews.titulo} onChange={e => setFormNews({...formNews, titulo: e.target.value})} placeholder="Ex: De Sola FC vence mais uma" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-[#edc515]" disabled={isUploadingNews}/>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-zinc-400 text-sm mb-1 flex items-center gap-2">
                  <UploadCloud size={16} className="text-[#edc515]"/> Imagem de Capa (Thumbnail)
                </label>
                <input 
                  id="news-file-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setImageNewsFile(e.target.files[0])} 
                  disabled={isUploadingNews}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#edc515] file:text-black file:font-bold cursor-pointer" 
                />
                <p className="mt-2 text-[10px] text-zinc-500">💡 Use fotos horizontais (proporção 16:9, ex: 1280x720px).</p>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isUploadingNews} 
              className="w-full md:w-auto bg-[#edc515] text-black font-black py-4 px-8 rounded hover:bg-yellow-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploadingNews ? "PUBLICANDO NOTÍCIA..." : "PUBLICAR NOTÍCIA"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDERIZAÇÃO GERAL E NAVEGAÇÃO
  // ==========================================
  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'elenco', label: 'Elenco', icon: Users },
    { id: 'torneios', label: 'Torneios', icon: Medal },
    { id: 'estrutura', label: 'Estrutura', icon: Building },
    { id: 'trofeus', label: 'Troféus', icon: Trophy },
    { id: 'torcida', label: 'Torcida', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black text-white font-sans selection:bg-[#edc515] selection:text-black pb-20 md:pb-0">
      
      {/* 👇 MODAL DE AVISO (DISCLAIMER) 👇 */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-[#edc515]/50 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_30px_rgba(237,197,21,0.15)] relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#edc515]/20 p-3 rounded-full text-[#edc515]">
                <Info size={28} />
              </div>
              <h2 className="text-2xl font-black text-white">Aviso Importante</h2>
            </div>
            
            <div className="space-y-4 text-zinc-300 text-sm md:text-base leading-relaxed mb-8">
              <p>
                Fala Diretoria! Este site é um <strong className="text-white">projeto não oficial</strong> criado de fã para fã, com o único intuito de apoiar e interagir com a série do canal <strong>De Sola</strong>.
              </p>
              <p>
                Nenhuma parte deste projeto é monetizada. Todas as imagens de jogadores e estruturas (como estádio e CT) são <strong>geradas por Inteligência Artificial</strong> apenas para fins de diversão e imersão.
              </p>
              <p>
                Se alguma imagem ou conteúdo causar desconforto, violar regras ou direitos autorais, por favor, entre em contato pelo email <a href={`mailto:${MEU_EMAIL_ADMIN}`} className="text-[#edc515] hover:underline">{MEU_EMAIL_ADMIN}</a> e faremos a remoção imediata.
              </p>
            </div>
            
            <button 
              onClick={handleCloseDisclaimer}
              className="w-full bg-[#edc515] hover:bg-yellow-500 text-black font-black py-4 rounded-xl transition-all shadow-lg text-lg"
            >
              Ciente! Vamos pro jogo ⚽
            </button>
          </div>
        </div>
      )}

      {/* CABEÇALHO DESKTOP */}
      <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-50 hidden md:block">
        <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          
          {/* 👇 A PASSAGEM SECRETA NO DESKTOP 👇 */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => setActiveTab('home')} 
            onDoubleClick={() => setActiveTab('admin')} 
            title="Acesso Diretoria"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={LOGO_ESCUDO_URL} className="w-full h-full object-contain" alt="Escudo" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">DE SOLA <span className="text-[#edc515]">FC</span></h1>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === item.id ? 'bg-[#edc515] text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* CABEÇALHO MOBILE */}
      <header className="bg-zinc-950 border-b border-zinc-900 p-4 sticky top-0 z-50 md:hidden flex justify-center items-center">
        
        {/* 👇 A PASSAGEM SECRETA NO MOBILE 👇 */}
        <h1 
          className="text-xl font-black tracking-tighter text-white flex items-center gap-2 select-none" 
          onDoubleClick={() => setActiveTab('admin')}
        >
          <img src={LOGO_ESCUDO_URL} className="w-8 h-8 object-contain" alt="Escudo" />
          DE SOLA <span className="text-[#edc515]">FC</span>
        </h1>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-10">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'elenco' && renderElenco()}
        {activeTab === 'torneios' && renderTorneios()}
        {activeTab === 'estrutura' && renderEstrutura()}
        {activeTab === 'trofeus' && renderTrofeus()}
        {activeTab === 'torcida' && renderTorcida()}
        {activeTab === 'admin' && renderAdmin()}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition ${activeTab === item.id ? 'text-[#edc515]' : 'text-zinc-500'}`}>
            <item.icon size={24} className={activeTab === item.id ? 'mb-1' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}