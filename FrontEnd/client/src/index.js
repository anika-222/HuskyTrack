import './aws'; // Amplify v6 config

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';        // your existing dashboard
import SignIn from './SignIn';
import { getCurrentUser } from 'aws-amplify/auth';

function Root() {
  const [authed, setAuthed] = React.useState(null); // null = checking

    React.useEffect(() => {
    (async () => {
        try {
        await getCurrentUser();     // throws if not signed in
        setAuthed(true);
        } catch {
        setAuthed(false);
        // if not signed in and not already on /signin -> go there
        if (window.location.pathname !== '/signin') {
            window.history.replaceState({}, '', '/signin');
        }
        }
    })();
    }, []);

  if (authed === null) return null; // (optional) show spinner

    const path = window.location.pathname;
    if (path === '/signin') {
        return authed ? <App /> : <SignIn />;
    }
  // path is '/', your dashboard route
    return authed ? <App /> : <SignIn />;
}

createRoot(document.getElementById('root')).render(<Root />);
