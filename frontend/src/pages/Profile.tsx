import React from 'react';
import { Navigate } from 'react-router-dom';
import Settings from './Settings';

export default function Profile() {
  // Profile is part of Settings
  return <Navigate to="/settings" replace />;
}
