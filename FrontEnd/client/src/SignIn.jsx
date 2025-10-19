import React, { useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export default function SignIn() {
    useEffect(() => { document.title = 'Sign in • HuskyTrack'; }, []);

    return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 420, maxWidth: '88vw' }}>
        <Authenticator
            formFields={{
            signIn: { username: { label: 'UW / CS Email' } },
            signUp: { email: { label: 'UW / CS Email' }, password: { label: 'Password' } },
            }}
        >
            {() => {
            // Signed in successfully → go to dashboard
            window.location.replace('/');
            return null;
            }}
        </Authenticator>
        </div>
    </div>
    );
}
