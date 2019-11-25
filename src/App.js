import '@reshuffle/code-transform/macro';
import React from 'react';

import { useAuth } from '@reshuffle/react-auth';

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const wrapperStyle = {
  ...centerStyle,
  width: '100%',
  height: '100%',
};

const contentStyle = {
  ...centerStyle,
  width: '40%',
  height: '20%',
};

const profileStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const linkStyle = {
  fontSize: '30px',
};

function ContentWrapper(props) {
  return (
    <div style={wrapperStyle}>
      <div style={contentStyle}>
        {props.children}
      </div>
    </div>
  );
}

function App() {
  const {
    loading,
    error,
    authenticated,
    profile,
    getLoginURL,
    getLogoutURL,
  } = useAuth();

  if (loading) {
    return <ContentWrapper><h2>Loading...</h2></ContentWrapper>;
  }
  if (error) {
    return <ContentWrapper><h1>{error.toString()}</h1></ContentWrapper>;
  }

  return (
    <ContentWrapper>
      {
        authenticated ? (
          <div style={profileStyle}>
            <img src={profile.picture}
                 alt='user profile'
            />
            <span>{profile.displayName}</span>
            <a style={linkStyle} href={getLogoutURL()}>Logout</a>
          </div>
        ) : (
          <a style={linkStyle} href={getLoginURL()}>Login</a>
        )
      }
    </ContentWrapper>
  );
}

export default App;
