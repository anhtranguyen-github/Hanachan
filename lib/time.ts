
/**
 * Global Time Management Utility for HanaTime Simulation.
 * Allows accelerating time pass or skipping time for testing SRS/FSRS flows.
 */

const STORAGE_KEY = 'hana_time_state';
const DEFAULT_SPEED = 1440; // 4 hours in 10 seconds -> 1 real second = 1440 simulated seconds

interface TimeState {
    anchorRealTime: number;
    anchorSimulatedTime: number;
    speedMultiplier: number;
    isPaused: boolean;
}

function getInitialState(): TimeState {
    if (typeof window === 'undefined') {
        return {
            anchorRealTime: Date.now(),
            anchorSimulatedTime: Date.now(),
            speedMultiplier: 1, // Start with real time on server
            isPaused: false
        };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse simulated time state', e);
        }
    }

    return {
        anchorRealTime: Date.now(),
        anchorSimulatedTime: Date.now(),
        speedMultiplier: 1, // Default to real time until toggled
        isPaused: false
    };
}

let state: TimeState = getInitialState();

function persistState() {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
}

export const HanaTime = {
    getNow(): Date {
        if (state.isPaused) {
            return new Date(state.anchorSimulatedTime);
        }
        const deltaReal = Date.now() - state.anchorRealTime;
        const deltaSimulated = deltaReal * state.speedMultiplier;
        return new Date(state.anchorSimulatedTime + deltaSimulated);
    },

    getNowISO(): string {
        return this.getNow().toISOString();
    },

    setSpeed(multiplier: number) {
        // Before changing speed, anchor the current simulated time to prevent jumps
        const nowSim = this.getNow().getTime();
        state.anchorRealTime = Date.now();
        state.anchorSimulatedTime = nowSim;
        state.speedMultiplier = multiplier;
        persistState();
    },

    setSimulatedTime(date: Date) {
        state.anchorRealTime = Date.now();
        state.anchorSimulatedTime = date.getTime();
        persistState();
    },

    skipTime(ms: number) {
        state.anchorSimulatedTime += ms;
        persistState();
    },

    togglePause() {
        if (state.isPaused) {
            // Resuming: update real anchor to now
            state.anchorRealTime = Date.now();
        } else {
            // Pausing: anchor becomes the fixed point
            state.anchorSimulatedTime = this.getNow().getTime();
        }
        state.isPaused = !state.isPaused;
        persistState();
    },

    getSpeed(): number {
        return state.speedMultiplier;
    },

    reset() {
        state = {
            anchorRealTime: Date.now(),
            anchorSimulatedTime: Date.now(),
            speedMultiplier: 1,
            isPaused: false
        };
        persistState();
    }
};

// Global helper for Date replacement
export const now = () => HanaTime.getNow();
