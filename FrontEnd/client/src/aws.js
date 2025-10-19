// v6-compatible Amplify config
import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
    // 👇 All Cognito-specific stuff now lives under Auth.Cognito
    Cognito: {
        userPoolId: 'us-west-2_jtm0nsaCP',
        userPoolClientId: '7ri0eftq2rek4m1gs7l7vaovbr',

      // v6 expects "loginWith", not "loginMechanisms"
      loginWith: { email: true },   // sign in with email (you can also set username/phone)
      // Optional sign-up fields (v6): signUpAttributes: ['email'], // if you want to require more
    },

    // Hosted UI / OAuth settings stay here under Auth
    oauth: {
      domain: 'us-west-2jtm0nsacp.auth.us-west-2.amazoncognito.com', // ← EXACT domain, no https://
        scope: ['openid', 'email', 'profile'],
        redirectSignIn: 'http://localhost:3000/',
        redirectSignOut: 'http://localhost:3000/',
        responseType: 'code',
    },
    },

    ssr: false,
});
