// src/pages/SignIn.jsx
import React, { useEffect } from 'react';
import {
  Authenticator,
  ThemeProvider,
  View,
  Heading,
  Text,
  Image
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const theme = {
  name: 'huskytrack',
  tokens: {
    colors: {
      brand: {
        primary: { // main accent
          10: '#f6f0fb',
          20: '#eadcf8',
          40: '#ccb0f0',
          60: '#a87ee6',
          80: '#8757d9',
          90: '#7442cf',
          100: '#6a1b9a' // deep husky purple
        }
      },
      font: {
        primary: { value: '#1d1532' },
        // make links (like "Forgot your password?") purple via token
        interactive: { value: '#6a1b9a' }
      }
    },
    radii: {
      xl: { value: '18px' },
      xxl: { value: '24px' },
      round: { value: '9999px' }
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: '{colors.brand.primary.100}' },
          borderColor: { value: 'transparent' },
          color: { value: '#ffffff' },
          borderRadius: { value: '{radii.xl}' },
          _hover: { backgroundColor: { value: '{colors.brand.primary.90}' } },
          _active: { backgroundColor: { value: '{colors.brand.primary.80}' } },
          _focus: { boxShadow: { value: '0 0 0 3px rgba(106,27,154,0.25)' } }
        }
      },
      authenticator: {
        router: {
          borderRadius: { value: '{radii.xxl}' },
          boxShadow: { value: '0 20px 60px rgba(26, 6, 56, 0.18)' },
          backgroundColor: { value: '#ffffff' },
          maxWidth: { value: '480px' }
        },
        form: { padding: { value: '1.25rem' } },
        socialProviderButton: { borderRadius: { value: '{radii.xl}' } },
        button: { borderRadius: { value: '{radii.xl}' } },
        tabs: {
          item: {
            active: {
              borderColor: { value: '{colors.brand.primary.100}' },
              color: { value: '{colors.brand.primary.100}' }
            }
          }
        }
      }
    }
  }
};

export default function SignIn(props) {
  useEffect(() => { document.title = 'Sign in • HuskyTrack'; }, []);

  return (
    <ThemeProvider theme={theme}>
      {/* safety: ensure any links inside Authenticator are purple (plus hover) */}
      <style>{`
        .amplify-authenticator a {
          color: #6a1b9a;
          text-decoration: none;
        }
        .amplify-authenticator a:hover {
          color: #7442cf;
          text-decoration: underline;
        }
      `}</style>

      {/* Background layer */}
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background:
            'radial-gradient(1200px 800px at 10% 10%, #f3e9ff 0%, rgba(255,255,255,0) 60%), ' +
            'radial-gradient(1000px 600px at 90% 20%, #efe6ff 0%, rgba(255,255,255,0) 55%), ' +
            'linear-gradient(180deg, #fbf9ff 0%, #f7f2ff 100%)'
        }}
      >
        {/* Card wrapper to add spacing & logo on top */}
        <div style={{ width: 'min(94vw, 520px)' }}>
          <Authenticator
            initialState="signIn"
            onStateChange={(authState) => {
              if (authState === 'signedIn') {
                props.onSignIn();
              }
            }}
            components={{
              Header() {
                return (
                  <View textAlign="center" padding="1.25rem 1.25rem 0.25rem">
                    {/* Circular logo badge — slightly bigger */}
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        margin: '0 auto 10px',
                        borderRadius: '9999px',
                        background: '#f3e9ff',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 10px 30px rgba(106, 27, 154, 0.18)',
                        border: '1px solid rgba(106,27,154,0.12)'
                      }}
                    >
                      <Image
                        src="/logo.png"
                        alt="HuskyTrack"
                        width="78"
                        height="78"
                        style={{
                          borderRadius: '9999px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>

                    <Heading
                      level={3}
                      style={{
                        margin: '4px 0 2px',
                        color: '#5b2aa2',
                        letterSpacing: '0.2px'
                      }}
                    >
                      HuskyTrack
                    </Heading>
                    <Text color="#6f5a9c" fontSize="0.95rem">
                      Your Courses. Your Path. 💜
                    </Text>
                  </View>
                );
              },
              Footer() {
                return (
                  <View textAlign="center" padding="0.75rem 1.25rem 1.25rem">
                    <Text color="#8a7ab3" fontSize="0.8rem">
                      By continuing you agree to our{' '}
                      <a href="/terms">Terms</a> & <a href="/privacy">Privacy</a>.
                    </Text>
                  </View>
                );
              }
            }}
            formFields={{
              signIn: { username: { label: 'UW / CS Email', placeholder: 'your_netid@uw.edu' } },
              signUp: {
                email: { label: 'UW / CS Email', placeholder: 'your_netid@uw.edu' },
                password: { label: 'Password' },
                name: { label: 'Full name', placeholder: 'Husky Dawg', order: 2 }
              }
            }}
          >
            {({ signOut, user }) => {
              props.onSignIn({
                name: user?.attributes?.name || '',
                email: user?.attributes?.email || '',
              });
              return null;
            }}
          </Authenticator>

          {/* Tiny “brand card” under the authenticator */}
          <div
            style={{
              margin: '16px auto 0',
              textAlign: 'center',
              color: '#7a64ad',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ opacity: 0.9 }}>🐾 Welcome back!</span>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
