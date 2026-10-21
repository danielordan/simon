import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

/** Frequencies of every oscillator started by the app, in order. */
export const playedFrequencies: number[] = [];

class FakeParam {
  value = 0;
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  cancelScheduledValues() {}
}

class FakeNode {
  connect(node: FakeNode) {
    return node;
  }
}

class FakeOscillator extends FakeNode {
  type = 'sine';
  frequency = new FakeParam();
  onended: (() => void) | null = null;
  start() {
    playedFrequencies.push(this.frequency.value);
  }
  stop() {}
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = new FakeNode();
  createOscillator() {
    return new FakeOscillator();
  }
  createGain() {
    return new FakeGain();
  }
  resume() {
    return Promise.resolve();
  }
}

globalThis.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
