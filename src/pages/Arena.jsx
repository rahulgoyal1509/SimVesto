import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DifficultySelect from './arena/DifficultySelect';
import PersonaAssignment from './arena/PersonaAssignment';
import SimulationWorkspace from './arena/SimulationWorkspace';
import DebriefView from './arena/DebriefView';

// Phase constants
const PHASE = { DIFFICULTY: 0, PERSONA: 1, SIMULATION: 2, DEBRIEF: 3 };

export default function Arena() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASE.DIFFICULTY);
  const [difficulty, setDifficulty] = useState(null);
  const [persona, setPersona] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const handleDifficultySelect = (mode) => {
    setDifficulty(mode);
    setPhase(PHASE.PERSONA);
  };

  const handlePersonaContinue = (generatedPersona) => {
    setPersona(generatedPersona);
    setPhase(PHASE.SIMULATION);
  };

  const handleSessionEnd = (data) => {
    setSessionData(data);
    setPhase(PHASE.DEBRIEF);
  };

  const handleRestart = () => {
    setDifficulty(null);
    setPersona(null);
    setSessionData(null);
    setPhase(PHASE.DIFFICULTY);
  };

  return (
    <div className="arena-root">
      {phase === PHASE.DIFFICULTY && (
        <DifficultySelect onSelect={handleDifficultySelect} />
      )}
      {phase === PHASE.PERSONA && (
        <PersonaAssignment difficulty={difficulty} onContinue={handlePersonaContinue} />
      )}
      {phase === PHASE.SIMULATION && persona && (
        <SimulationWorkspace
          difficulty={difficulty}
          persona={persona}
          onEnd={handleSessionEnd}
        />
      )}
      {phase === PHASE.DEBRIEF && sessionData && (
        <DebriefView
          sessionData={sessionData}
          onRestart={handleRestart}
          onHome={() => navigate('/app')}
        />
      )}
    </div>
  );
}
