import UnauthorizedPage from './UnauthorizedPage';

export default function ProtectedRoute({ user, children }) {
  if (!user) {
    return <UnauthorizedPage />;
  }
  return children;
}
