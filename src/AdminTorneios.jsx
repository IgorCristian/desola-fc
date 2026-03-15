import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; 
import { Calendar, Save, Check, Edit, Trash2, X } from 'lucide-react';

const TIMES_PAULISTAO = [
  "De Sola FC", "Palmeiras", "São Paulo", "Corinthians", "Bragantino",
  "Santos", "Primavera", "Mirassol", "São Bernardo", "Novorizontino",
  "Botafogo-SP", "Ponte Preta", "Guarani", "Ituano", "Ferroviária", "Inter de Limeira"
];

export default function AdminTorneios() {
  const [partidas, setPartidas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  
  // NOME DA RODADA (Aplicado a todos os 8 jogos)
  const [rodadaNome, setRodadaNome] = useState('');

  // ESTADO DA RODADA COMPLETA (Array com 8 jogos)
  const [jogosRodada, setJogosRodada] = useState([
    { timeC: TIMES_PAULISTAO[0], timeF: TIMES_PAULISTAO[1], estadio: '' },
    { timeC: TIMES_PAULISTAO[2], timeF: TIMES_PAULISTAO[3], estadio: '' },
    { timeC: TIMES_PAULISTAO[4], timeF: TIMES_PAULISTAO[5], estadio: '' },
    { timeC: TIMES_PAULISTAO[6], timeF: TIMES_PAULISTAO[7], estadio: '' },
    { timeC: TIMES_PAULISTAO[8], timeF: TIMES_PAULISTAO[9], estadio: '' },
    { timeC: TIMES_PAULISTAO[10], timeF: TIMES_PAULISTAO[11], estadio: '' },
    { timeC: TIMES_PAULISTAO[12], timeF: TIMES_PAULISTAO[13], estadio: '' },
    { timeC: TIMES_PAULISTAO[14], timeF: TIMES_PAULISTAO[15], estadio: '' },
  ]);

  // NOVOS ESTADOS PARA EDIÇÃO NA LISTA DE BAIXO
  const [editingId, setEditingId] = useState(null);
  // 👇 Adicionei o 'estadio' no estado de edição
  const [editPartida, setEditPartida] = useState({ rodada: '', timeC: '', timeF: '', estadio: '' });

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'partidas'), (snapshot) => {
      const partidasBuscadas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      partidasBuscadas.sort((a, b) => b.timestamp - a.timestamp);
      setPartidas(partidasBuscadas);
    });
    return () => unsubscribe();
  }, []);

  // FUNÇÃO PARA ATUALIZAR UM JOGO ESPECÍFICO NA LISTA DE 8 JOGOS
  const handleJogoChange = (index, campo, valor) => {
    const novaLista = [...jogosRodada];
    novaLista[index] = { ...novaLista[index], [campo]: valor };
    setJogosRodada(novaLista);
  };

  // FUNÇÃO PARA SALVAR TODOS OS 8 JOGOS DE UMA VEZ
  const handleSalvarRodadaCompleta = async (e) => {
    e.preventDefault();
    if (!rodadaNome) {
      alert("Por favor, preencha o nome da rodada!");
      return;
    }

    setSalvando(true);
    try {
      const promessas = jogosRodada.map(jogo => {
        const estadioFinal = (jogo.timeC === 'De Sola FC' || jogo.timeF === 'De Sola FC') 
          ? jogo.estadio 
          : 'Estádio Adversário / Indefinido';

        return addDoc(collection(db, 'partidas'), {
          campeonato: 'Paulistão',
          rodada: rodadaNome,
          timeC: jogo.timeC,
          timeF: jogo.timeF,
          estadio: estadioFinal,
          golsC: null,
          golsF: null,
          timestamp: Date.now()
        });
      });

      await Promise.all(promessas);
      
      alert("Rodada inteira agendada com sucesso!");
      setRodadaNome(''); 
      
      const listaLimpa = jogosRodada.map(jogo => ({...jogo, estadio: ''}));
      setJogosRodada(listaLimpa);

    } catch (error) {
      console.error("Erro ao agendar rodada:", error);
      alert("Erro ao salvar a rodada.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarResultado = async (id, golsC, golsF) => {
    try {
      const partidaRef = doc(db, 'partidas', id);
      await updateDoc(partidaRef, { golsC: parseInt(golsC), golsF: parseInt(golsF) });
      alert("Resultado salvo!");
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // FUNÇÕES PARA EDITAR / APAGAR JOGOS NA LISTA
  // ==========================================
  const handleStartEdit = (partida) => {
    setEditingId(partida.id);
    // 👇 Puxa o estádio original do banco na hora de abrir o lápis
    setEditPartida({ 
      rodada: partida.rodada, 
      timeC: partida.timeC, 
      timeF: partida.timeF,
      estadio: partida.estadio || '' 
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    if (editPartida.timeC === editPartida.timeF) {
      alert("As equipes não podem ser iguais!");
      return;
    }

    // 👇 Define o estádio final da edição (igual ao criador de rodada)
    const estadioFinalEdit = (editPartida.timeC === 'De Sola FC' || editPartida.timeF === 'De Sola FC') 
      ? editPartida.estadio 
      : 'Estádio Adversário / Indefinido';

    try {
      const partidaRef = doc(db, 'partidas', id);
      await updateDoc(partidaRef, {
        rodada: editPartida.rodada,
        timeC: editPartida.timeC,
        timeF: editPartida.timeF,
        estadio: estadioFinalEdit
      });
      setEditingId(null);
      alert("Confronto atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao editar partida:", error);
      alert("Erro ao salvar a edição.");
    }
  };

  const handleDeletePartida = async (id) => {
    if (window.confirm("Atenção! Tem certeza que deseja apagar este jogo permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'partidas', id));
      } catch (error) {
        console.error("Erro ao deletar partida:", error);
        alert("Erro ao excluir o jogo.");
      }
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg mt-8">
      <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2">
        <Calendar className="text-[#edc515]"/> Gerenciar Torneios
      </h3>

      {/* ==========================================
          FORMULÁRIO DE CRIAÇÃO (MÚLTIPLOS JOGOS)
      ========================================== */}
      <form onSubmit={handleSalvarRodadaCompleta} className="mb-10 bg-zinc-950 p-6 rounded-lg border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h4 className="text-[#edc515] font-bold text-lg">Criar Rodada Completa</h4>
          <input 
            type="text" 
            value={rodadaNome} 
            onChange={e => setRodadaNome(e.target.value)} 
            placeholder="Nome da Rodada (Ex: Rodada 10)" 
            className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white focus:border-[#edc515] outline-none"
            required
          />
        </div>

        <div className="space-y-4">
          {jogosRodada.map((jogo, index) => {
            const isDeSola = jogo.timeC === 'De Sola FC' || jogo.timeF === 'De Sola FC';

            return (
              <div key={index} className={`grid grid-cols-1 md:grid-cols-7 gap-3 items-center p-3 rounded-md border ${isDeSola ? 'border-[#edc515]/30 bg-[#edc515]/5' : 'border-zinc-800 bg-zinc-900'}`}>
                
                <span className="text-zinc-500 text-sm font-bold md:col-span-1 hidden md:block">Jogo {index + 1}</span>
                
                <select value={jogo.timeC} onChange={e => handleJogoChange(index, 'timeC', e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-[#edc515] outline-none w-full md:col-span-2">
                  {TIMES_PAULISTAO.map(time => <option key={`C-${time}`} value={time}>{time}</option>)}
                </select>
                
                <span className="text-zinc-500 font-bold text-center hidden md:block">X</span>
                
                <select value={jogo.timeF} onChange={e => handleJogoChange(index, 'timeF', e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-[#edc515] outline-none w-full md:col-span-2">
                  {TIMES_PAULISTAO.map(time => <option key={`F-${time}`} value={time}>{time}</option>)}
                </select>

                <div className="md:col-span-1">
                  {isDeSola ? (
                    <input 
                      type="text" 
                      value={jogo.estadio} 
                      onChange={e => handleJogoChange(index, 'estadio', e.target.value)} 
                      placeholder="Estádio" 
                      required 
                      className="bg-zinc-800 border border-[#edc515]/50 rounded p-2 text-white focus:border-[#edc515] outline-none w-full text-sm placeholder-[#edc515]/50"
                    />
                  ) : (
                    <span className="text-xs text-zinc-600 block text-center">Auto</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        <button 
          type="submit" 
          disabled={salvando}
          className="mt-6 w-full bg-[#edc515] text-black font-black py-4 px-8 rounded hover:bg-yellow-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {salvando ? "SALVANDO RODADA..." : <><Check size={20} /> SALVAR TODOS OS JOGOS</>}
        </button>
      </form>

      {/* ==========================================
          LISTA PARA INSERIR RESULTADOS E EDITAR
      ========================================== */}
      <div>
        <h4 className="text-white font-bold mb-4">Atualizar Resultados (Placar)</h4>
        <div className="space-y-3">
          {partidas.filter(p => p.golsC === null).length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhum jogo aguardando resultado.</p>
          ) : (
            partidas.filter(p => p.golsC === null).map(partida => {
              // Verifica se o De Sola está envolvido na edição atual para mostrar o campo do estádio
              const isEditDeSola = editPartida.timeC === 'De Sola FC' || editPartida.timeF === 'De Sola FC';

              return (
                <div key={partida.id} className={`bg-zinc-950 border p-4 rounded-lg flex flex-col xl:flex-row items-center justify-between gap-4 ${partida.timeC === 'De Sola FC' || partida.timeF === 'De Sola FC' ? 'border-[#edc515]/30' : 'border-zinc-800'}`}>
                  
                  {/* SE ESTIVER EM MODO DE EDIÇÃO */}
                  {editingId === partida.id ? (
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                      <input 
                        type="text" 
                        value={editPartida.rodada} 
                        onChange={e => setEditPartida({...editPartida, rodada: e.target.value})} 
                        className="bg-zinc-900 border border-zinc-700 p-2 text-sm rounded text-white outline-none w-full md:w-32 text-center" 
                        placeholder="Rodada"
                      />
                      
                      <select value={editPartida.timeC} onChange={e => setEditPartida({...editPartida, timeC: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-2 text-sm rounded text-white outline-none w-full md:w-auto">
                        {TIMES_PAULISTAO.map(t => <option key={`edC-${t}`} value={t}>{t}</option>)}
                      </select>
                      
                      <span className="text-zinc-500 font-bold text-xs hidden md:block">VS</span>
                      
                      <select value={editPartida.timeF} onChange={e => setEditPartida({...editPartida, timeF: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-2 text-sm rounded text-white outline-none w-full md:w-auto">
                        {TIMES_PAULISTAO.map(t => <option key={`edF-${t}`} value={t}>{t}</option>)}
                      </select>

                      {/* 👇 AQUI: CAMPO DE ESTÁDIO APARECE SE FOR JOGO DO DE SOLA 👇 */}
                      {isEditDeSola && (
                        <input 
                          type="text" 
                          value={editPartida.estadio} 
                          onChange={e => setEditPartida({...editPartida, estadio: e.target.value})} 
                          placeholder="Estádio do jogo" 
                          required
                          className="bg-zinc-900 border border-[#edc515]/50 p-2 text-sm rounded text-white outline-none w-full md:w-40 placeholder-[#edc515]/50" 
                        />
                      )}
                      
                      <div className="flex gap-2 mt-2 md:mt-0 ml-auto w-full md:w-auto justify-end">
                        <button onClick={() => handleSaveEdit(partida.id)} className="bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white p-2 rounded transition border border-green-600/30">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancelEdit} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded transition border border-red-600/30">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    
                    /* MODO NORMAL (VISUALIZAÇÃO + PLACAR) */
                    <>
                      <div className="text-zinc-300 font-medium text-center xl:text-left flex-1 flex flex-col md:flex-row items-center gap-2">
                        <span className="text-zinc-500 text-xs font-bold uppercase w-24">[{partida.rodada}]</span>
                        <span className={`w-32 text-right truncate ${partida.timeC === 'De Sola FC' ? 'text-[#edc515] font-bold' : ''}`}>{partida.timeC}</span>
                        <span className="text-zinc-600 text-xs font-black">vs</span>
                        <span className={`w-32 text-left truncate ${partida.timeF === 'De Sola FC' ? 'text-[#edc515] font-bold' : ''}`}>{partida.timeF}</span>
                      </div>
                      
                      <div className="flex flex-wrap justify-center items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 mr-2">
                          <input type="number" min="0" id={`golC-${partida.id}`} className="w-14 bg-zinc-900 border border-zinc-700 rounded py-1.5 text-white text-center text-sm" placeholder="Casa" />
                          <span className="text-zinc-500 font-black text-xs">X</span>
                          <input type="number" min="0" id={`golF-${partida.id}`} className="w-14 bg-zinc-900 border border-zinc-700 rounded py-1.5 text-white text-center text-sm" placeholder="Fora" />
                        </div>
                        
                        <button 
                          title="Salvar Resultado"
                          onClick={() => {
                            const gC = document.getElementById(`golC-${partida.id}`).value;
                            const gF = document.getElementById(`golF-${partida.id}`).value;
                            if(gC !== '' && gF !== '') handleAtualizarResultado(partida.id, gC, gF);
                            else alert("Preencha os dois gols antes de salvar.");
                          }}
                          className="bg-[#edc515]/10 text-[#edc515] hover:bg-[#edc515] hover:text-black p-2.5 rounded transition border border-[#edc515]/30"
                        >
                          <Save size={18} />
                        </button>

                        <button 
                          title="Editar Confronto"
                          onClick={() => handleStartEdit(partida)} 
                          className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white p-2.5 rounded transition border border-blue-500/20"
                        >
                          <Edit size={18} />
                        </button>

                        <button 
                          title="Apagar Jogo"
                          onClick={() => handleDeletePartida(partida.id)} 
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2.5 rounded transition border border-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}