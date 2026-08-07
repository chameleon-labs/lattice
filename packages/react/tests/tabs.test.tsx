import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {Tab, TabList, TabPanel, TabProvider} from '../src/tabs/tabs.js';

describe('Tabs', () => {
  const setup = () =>
    render(
      <TabProvider defaultSelectedId="thirty">
        <TabList aria-label="Window">
          <Tab id="thirty">30 days</Tab>
          <Tab id="ninety">90 days</Tab>
        </TabList>
        <TabPanel tabId="thirty">Thirty days of history</TabPanel>
        <TabPanel tabId="ninety">Ninety days of history</TabPanel>
      </TabProvider>,
    );

  it('exposes a tablist with its tabs', () => {
    setup();

    expect(screen.getByRole('tablist', {name: 'Window'})).toBeDefined();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('marks the selected tab and shows only its panel', () => {
    setup();

    expect(screen.getByRole('tab', {name: '30 days'}).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', {name: '90 days'}).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByText('Thirty days of history')).toBeDefined();
  });

  // Automatic activation: APG's default, correct here because the panels are
  // already rendered, and cheaper for a keyboard user than pressing Enter on
  // every move.
  it('moves selection with arrow keys, without needing Enter', async () => {
    const user = userEvent.setup();
    setup();

    // Focus is established by clicking the selected tab rather than by tabbing
    // from wherever the previous test left it. The subject here is arrow-key
    // activation, not tab order, and ambient focus state leaks between tests.
    await user.click(screen.getByRole('tab', {name: '30 days'}));
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(screen.getByRole('tab', {name: '90 days'}).getAttribute('aria-selected')).toBe('true');
    });
    expect(screen.getByText('Ninety days of history')).toBeDefined();
  });

  it('associates each panel with its tab', () => {
    setup();
    const tab = screen.getByRole('tab', {name: '30 days'});
    const panel = screen.getByRole('tabpanel');

    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });
});
