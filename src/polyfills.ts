// @ts-nocheck — polyfill shims for CyberChef's browser dependencies
import { Buffer } from 'buffer';
import process from 'process/browser';

(globalThis as any).Buffer = Buffer;
(globalThis as any).process = process;
(globalThis as any).global = globalThis;
