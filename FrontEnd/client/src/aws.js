import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
    region: 'us-west-2',
    userPoolId: 'us-west-2_jtm0nsaCP',
    userPoolWebClientId: '7ri0eftq2rek4m1gs7l7vaovbr',
    oauth: {
        domain: 'https://us-west-2jtm0nsacp.auth.us-west-2.amazoncognito.com',
        scope: ['openid', 'email', 'profile'],
        redirectSignIn: 'http://localhost:3000/',
        redirectSignOut: 'http://localhost:3000/',
        responseType: 'code',
    },
    },
    ssr: false,
});
