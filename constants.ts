
import { Microgreen } from './types';

export const INITIAL_MICROGREENS: Microgreen[] = [
  {
    id: 'radish',
    name: 'Reďkovka China Rose',
    description: 'Pikantná, chrumkavá s krásnymi ružovými stonkami.',
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=400',
    pricePerUnit: 4.5,
    availableWeights: [50, 100, 250]
  },
  {
    id: 'sunflower',
    name: 'Slnečnica',
    description: 'Orechová chuť, sladká a mimoriadne chrumkavá.',
    image: 'https://images.unsplash.com/photo-1592144702958-8687a74959a4?auto=format&fit=crop&q=80&w=400',
    pricePerUnit: 5.0,
    availableWeights: [50, 100, 250]
  },
  {
    id: 'pea-shoots',
    name: 'Hráškové výhonky',
    description: 'Chutí ako čerstvý jarný hrášok. Jemné a sladké.',
    image: 'https://images.unsplash.com/photo-1622484211148-716499368181?auto=format&fit=crop&q=80&w=400',
    pricePerUnit: 4.0,
    availableWeights: [50, 100, 250]
  },
  {
    id: 'broccoli',
    name: 'Brokolica',
    description: 'Jemná chuť a vysoko výživná superpotravina.',
    image: 'https://images.unsplash.com/photo-1616422791838-898492211624?auto=format&fit=crop&q=80&w=400',
    pricePerUnit: 6.0,
    availableWeights: [50, 100, 250]
  }
];
