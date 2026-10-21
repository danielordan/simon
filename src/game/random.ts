import type { Rng } from './types';

export const cryptoRng: Rng = () => crypto.getRandomValues(new Uint32Array(1))[0] % 4;
