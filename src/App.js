import '@reshuffle/code-transform/macro';
import React, { useState, useEffect } from 'react';

import { useAuth } from '@reshuffle/react-auth';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Delete from '@material-ui/icons/Delete';

import { addSlackMessage, getMessages, rmSlackMessage } from '../backend/hello';

import './App.scss';
import slackReshuffle from './slack-reshuffle.svg';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    paddingBottom: theme.spacing(9),
  },
  green: {
    width: '100%',
    minWidth: '80%',
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: '#E7F9F0',
  },
  fullWidth: {
    padding: theme.spacing(3, 2),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '100%',
  },
  textField: {
    backgroundColor: 'white',
  },
  trigger: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
}));

function CenterContent(props) {
  return (
    <div className='content'>
      {props.children}
    </div>
  );
}

function ContentWrapper(props) {
  return (
    <div className='wrapper center'>
      {props.children}
    </div>
  );
}

function Box(props) {
  const classes = useStyles();
  return (
    <ContentWrapper>
      <CenterContent>
        <Paper className={classes.fullWidth}>
          {props.children}
        </Paper>
      </CenterContent>
    </ContentWrapper>
  );
}

function Display(props) {
  const classes = useStyles();
  return (
    <div className='wrapper'>
      <div className='display'>
        <div className='config'>
          <Paper className={classes.fullWidth}>
            {props.children}
          </Paper>
        </div>
      </div>
    </div>
  );
}

function DisplayCard(props) {
  return (
    <div className='displaycard'>
      {props.children}
    </div>
  );
}

const tryHello = async (event) => {
  event.preventDefault();
  // // const response = await getUserId();
  // console.log(response);
}

const isReshuffleUser = (email) => {
  const domain = email.split('@').pop();
  if (domain !== 'reshuffle.com') {
    return false;
  }
  return true;
}

function Input(props) {
  const [trigger, setTrigger] = useState('');
  const [message, setMessage] = useState('');

  const addMessage = async (event) => {
    event.preventDefault();
    const form = document.getElementById('addform');
    if (form === null || !form.checkValidity()) {
      return;
    }

    await addSlackMessage(trigger, message);
    const newState = await getMessages();
    props.setExisting(newState);
    setMessage('');
    setTrigger('');
  }


  const classes = useStyles();
  return (
    <Paper className={classes.green}>
      <div className='addmessage'>
        <form noValidate
              id='addform'
              onSubmit={addMessage}
              className='addform'
        >
          <TextField
            required
            id='slack-trigger'
            label='trigger'
            defaultValue='aword'
            className={classes.trigger}
            variant='outlined'
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          />
          <TextField
            required
            id='slack-message'
            label='message'
            multiline
            rows='2'
            defaultValue='Hello slack'
            className={classes.textField}
            margin='normal'
            variant='outlined'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant='contained'
                  size='large'
                  type='submit'
          >
            Create trigger
          </Button>
        </form>
      </div>
    </Paper>
  );
}

const itemsEqual = (msg0, msg1) => {
  const len = msg0.length === msg1.length;
  if (!len) {
    return false;
  }
  for (let i = 0; i < msg0.length; i += 1) {
    const cM = msg0[i];
    const has = msg1.some(({ trigger, message }) => {
      return trigger === cM.trigger && message === cM.message;
    });
    if (!has) {
      return false;
    }
  }
  return true;
}

function App() {
  const classes = useStyles();
  const {
    loading,
    error,
    authenticated,
    profile,
    getLoginURL,
    getLogoutURL,
  } = useAuth();


  const handleDelete = async (event, trigger) => {
    event.preventDefault();
    await rmSlackMessage(trigger);
    const newState = await getMessages();
    setExisting(newState);
  };

  const [existing, setExisting] = useState([]);
  useEffect(() => {
    async function loadExisting() {
      const existMessages = await getMessages();
      if (!itemsEqual(existMessages, existing)) {
        setExisting(existMessages);
      }
    }
    if (authenticated) {
      loadExisting();
    }
  });

  if (loading) {
    return <ContentWrapper><h2>Loading...</h2></ContentWrapper>;
  }
  if (error) {
    return <ContentWrapper><h1>{error.toString()}</h1></ContentWrapper>;
  }

  let reshuffleUser = false;
  if (profile && profile.emails) {
    const userEmail = profile.emails[0];
    reshuffleUser = isReshuffleUser(userEmail.value);
  }

  if (!authenticated) {
    return (
      <Box>
        <Typography variant='h5'>
          Reshuffle Slack Control
        </Typography>
        <img className='logo' src={slackReshuffle} />
        <Button variant='contained'
                href={getLoginURL()}
                size='large'
        >
          Login with a valid Reshuffle email
        </Button>
      </Box>
    );
  }

  if (!reshuffleUser) {
    return (
      <Box>
        <Typography variant='h5'>
          Please logout and login using an "@reshuffle.com" account
        </Typography>
        <img className='logo' src={slackReshuffle} />
        <Button variant='contained'
                href={getLogoutURL()}
                size='large'
        >
          Logout
        </Button>
      </Box>
    );
  }

  console.log(existing);
  return (
    <Display>
      <Typography variant='h5'>
        Reshuffle Slack Control
      </Typography>
      <Input setExisting={setExisting}/>
      {
        existing.map(({ trigger, message }) => {
          return (
            <Paper className={classes.green}>
              <div className='addmessage'>
                trigger: {trigger} | message: {message}
              </div>
              <IconButton onClick={(e) => handleDelete(e, trigger)}>
                <Delete />
              </IconButton>
            </Paper>
          );
        })
      }
    </Display>
  );

  // return (
  //   <Display>
  //     <Typography variant='h5'>
  //       Reshuffle Slack Control
  //     </Typography>
  //   </Display>
  // );
  // return (
  //   <Box>
  //     <Typography variant='h5'>
  //       Reshuffle Slack Control
  //     </Typography>
  //     <img className='logo' src={slackReshuffle} />
  //     {
  //       authenticated ? (
  //         <div>
  //           <img src={profile.picture}
  //                alt='user profile'
  //           />
  //           <button onClick={tryHello}>
  //             Slack me
  //           </button>
  //           <span>{profile.displayName}</span>
  //           <a className='link' href={getLogoutURL()}>Logout</a>
  //         </div>
  //       ) : (
  //         <Button variant='contained'
  //                 href={getLoginURL()}
  //                 size='large'
  //         >
  //           Login with a valid Reshuffle email
  //         </Button>
  //       )
  //     }
  //   </Box>
  // );
    // if (reshuffleUser) {

    // }
  // }

}

export default App;
