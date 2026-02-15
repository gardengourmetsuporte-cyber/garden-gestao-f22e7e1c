import { InicianteFrame } from './InicianteFrame';
import { AprendizFrame } from './AprendizFrame';
import { DedicadoFrame } from './DedicadoFrame';
import { VeteranoFrame } from './VeteranoFrame';
import { MestreFrame } from './MestreFrame';
import { LendaFrame } from './LendaFrame';
import { MiticoFrame } from './MiticoFrame';
import { ImortalFrame } from './ImortalFrame';

export const RANK_FRAMES: Record<string, React.ComponentType<{ size: number; children: React.ReactNode }>> = {
  'Iniciante': InicianteFrame,
  'Aprendiz': AprendizFrame,
  'Dedicado': DedicadoFrame,
  'Veterano': VeteranoFrame,
  'Mestre': MestreFrame,
  'Lenda': LendaFrame,
  'Mítico': MiticoFrame,
  'Imortal': ImortalFrame,
};

export {
  InicianteFrame,
  AprendizFrame,
  DedicadoFrame,
  VeteranoFrame,
  MestreFrame,
  LendaFrame,
  MiticoFrame,
  ImortalFrame,
};
