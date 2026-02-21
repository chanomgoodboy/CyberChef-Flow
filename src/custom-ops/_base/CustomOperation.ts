import Operation from '@cyberchef/Operation.mjs';

/**
 * Base class for custom CyberWeb operations.
 * Extends CyberChef's Operation so the adapter/executor treat it identically.
 */
export default class CustomOperation extends (Operation as any) {
  constructor() {
    super();
    this.module = 'Custom';
  }
}
