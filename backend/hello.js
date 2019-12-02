import { get, update, remove } from '@reshuffle/db';
import { getCurrentUser } from '@reshuffle/server-function';

import { slackApp, originalNumListeners } from './_handler';
import { resetAndAdd } from './slack';

const { APPROVED_DOMAIN } = process.env;

function validateUser() {
  const user = getCurrentUser(true);
  const userEmail = user.emails[0].value;
  const domain = userEmail.split('@').pop();
  if (domain !== 'reshuffle.com') {
    throw new Error('Unauthenticated user');
  }
  return user;
}

/* @expose */
export async function getMessages() {
  validateUser();
  return get('slack-messages');
}

/* @expose */
export async function addSlackMessage(trigger, message) {
  validateUser();
  await update('slack-messages', (initialHandlers = []) => {
    const noDupes = initialHandlers.filter((handler) =>
      handler.trigger !== trigger);
    return [...noDupes, { trigger, message }]
  });
  await resetAndAdd();
  return { trigger, message };
}

/* @expose */
export async function rmSlackMessage(trigger) {
  validateUser();
  const oldCount = slackApp.listeners.length;
  await update('slack-messages', (initialHandlers = []) => {
    return initialHandlers.filter((handler) =>
      handler.trigger !== trigger);
  });
  await resetAndAdd();
  return { trigger };
}
