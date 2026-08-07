// React Testing Library only auto-cleans when a global afterEach exists, and
// this package does not enable vitest globals. Registering it explicitly is
// what keeps one test's mounted tree out of the next one's queries.
import {cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';

afterEach(() => {
  cleanup();
});
