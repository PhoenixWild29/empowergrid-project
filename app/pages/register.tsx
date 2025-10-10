import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import RegistrationForm from '../components/auth/RegistrationForm';

/**
 * User Registration Page
 * 
 * Public page for new user registration
 */
export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <Layout>
      <div className="register-page">
        <div className="register-container">
          <RegistrationForm onSuccess={handleSuccess} />
        </div>

        <style jsx>{`
          .register-page {
            min-height: calc(100vh - 200px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .register-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }
        `}</style>
      </div>
    </Layout>
  );
}




