import express from 'express';
import { defaultHandler } from '@reshuffle/server-function';
import { authRouter } from '@reshuffle/passport';

const { App, ExpressReceiver, directMention } = require('@slack/bolt');

import { maybeAddOriginals } from './slack';

const hasSlack = process.env.SLACK_SIGNING_SECRET;

let slackApp;
let originalNumListeners = 0;

if (hasSlack) {
const eR = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack-events',
});

slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: eR,
});

slackApp.message('badger', ({ say }) => say('Badgers? BADGERS? WE DON’T NEED NO STINKIN BADGERS'));

slackApp.message(/open the (.*) doors/i, ({ say, context }) => {
  const doorType = context.matches[1];

  const text = (doorType === 'pod bay') ?
    'I’m afraid I can’t let you do that.' :
    `Opening ${doorType} doors`;

  say(text);
});


slackApp.message('I like pie', async ({ message, context }) => {
  try {
    await slackApp.client.reactions.add({
      token: context.botToken,
      name: 'pie',
      channel: message.channel,
      timestamp: message.ts,
    });
  } catch (error) {
    console.error(error);
  }
});

const lulz = ['lol', 'rofl', 'lmao'];

const randomLulz = () => lulz[Math.floor(Math.random() * lulz.length)];

slackApp.event('app_mention', ({ say }) => say(randomLulz()));

const enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you']
const leaveReplies = ['Are you still there?', 'Target lost', 'Searching']

const randomEnterReply = () => enterReplies[Math.floor(Math.random() * enterReplies.length)];
const randomLeaveReply = () => leaveReplies[Math.floor(Math.random() * leaveReplies.length)];

slackApp.event('member_joined_channel', ({ say }) => say(randomEnterReply()));
slackApp.event('member_left_channel', ({ say }) => say(randomLeaveReply()));

const answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING

slackApp.message(
  directMention(),
  'what is the answer to the ultimate question of life',
  ({ say }) => {
    if (answer) { say(`${answer}, but what is the question?`); }
  });

slackApp.message('you are a little slow', ({ say }) => {
  setTimeout(() => say('Who you calling "slow"?'), 60 * 1000);
});

let annoyIntervalId = null

slackApp.message(directMention(), /(?<!un)annoy me/, ({ say }) => {
  if (annoyIntervalId) {
    say('AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH');
    return;
  }

  say('Hey, want to hear the most annoying sound in the world?');
  annoyIntervalId = setInterval(() => {
    say('AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH');
  }, 1000);
});

slackApp.message(directMention(), 'unannoy me', ({ say }) => {
  if (!annoyIntervalId) {
    say('Not annoying you right now, am I?');
    return;
  }
  say('OKAY, OKAY, OKAY!');
  clearInterval(annoyIntervalId);
  annoyIntervalId = null;
});

slackApp.error((error) => {
  const message = `DOES NOT COMPUTE: ${error.toString()}`;
  console.error(message);

  // 🚫 no reply handling from global error handler
});

// NOTE: In a real application, you should provide a convoStore option to the App constructor. The default convoStore
//       only persists data to memory, so its lost when the process terminates.
slackApp.message(directMention(), 'have a soda', async ({ context, say }) => {
  // Initialize conversation
  const conversation = context.conversation !== undefined ? context.conversation : {};

  // Initialize data for this listener
  conversation.sodasHad = conversation.sodasHad !== undefined ? conversation.sodasHad : 0;

  if (conversation.sodasHad > 4) {
    say('I\'m too fizzy...');
    return;
  }

  say('Sure!');
  conversation.sodasHad += 1;
  try {
    await context.updateConversation(conversation);
  } catch (error) {
    console.error(error);
  }
});

slackApp.message(directMention(), 'sleep it off', async ({ context, say }) => {
  try {
    await context.updateConversation({ ...context.conversation, sodasHad: 0 });
      say('zzzzz');
    } catch (error) {
      console.error(error);
    }
  });
  originalNumListeners = slackApp.listeners.length;
}

const app = express();
app.use(authRouter());
app.use(async (req, res, next) => {
  await maybeAddOriginals();
  next();
});

if (hasSlack && slackApp) {
  app.use(slackApp.receiver.app);
} else {
  slackApp = undefined;
}

export { slackApp, originalNumListeners };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route/middleware used for responding to the challenge
app.use('/slack-events', async (req, res, next) => {
  if (req.body && req.body.challenge) {
    res.json(req.body.challenge);
    return;
  }
  next(req, res);
});

app.use(defaultHandler)

export default app;
