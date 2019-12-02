import { get, update, remove } from '@reshuffle/db';
import { slackApp, originalNumListeners } from './_handler';

function resetToOriginal() {
  if (!slackApp) {
    return;
  }
  while (slackApp.listeners.length !== originalNumListeners) {
    slackApp.listeners.pop();
  }
}

export async function maybeAddOriginals() {
  if (!slackApp) {
    return;
  }
  const listCount = slackApp.listeners.length;
  const original = listCount === originalNumListeners;
  if (!original) {
    return;
  }
  const messages = await get('slack-messages');
  if (messages) {
    messages.forEach(({ trigger, message }) => {
      slackApp.message(trigger,
        ({ say }) => say(message));
    });
  }
}

export async function resetAndAdd() {
  resetToOriginal();
  await maybeAddOriginals();
}
