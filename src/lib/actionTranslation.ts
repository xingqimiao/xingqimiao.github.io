import type { ActionStatus } from './actionPresentation'

// English copy for the Projects (action) page. Keys mirror actions.json ids;
// the page falls back to the Chinese copy for ids without an entry.
export const actionEnglishCopy = {
  heading: 'Action, Change the Present',
  statusLabels: {
    running: 'In progress',
    paused: 'Paused',
    completed: 'Completed',
    delayed: 'Delayed',
    failed: 'Failed',
  } as Record<ActionStatus, string>,
  items: {
    '1': {
      name: '2026 Survey of the Living Conditions of Transgender People in Chinese Online Communities',
      desc: 'This survey documents the real living conditions of transgender people in China, so the world can hear our voice.',
    },
    'project-1786565590451': {
      name: 'The "Unremarkable" Stories 2026',
      desc: 'Experiences deserve to be seen. We collected over 100 stories from trans people and keep them safely on the internet.',
    },
    '4': {
      name: 'China Transgender Survival Handbook 2.0',
      desc: 'A revision of version 1.0 that addresses common issues through community feedback and survey research.',
    },
  } as Record<string, { name: string; desc: string }>,
}
