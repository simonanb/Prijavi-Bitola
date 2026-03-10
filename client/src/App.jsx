import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage  from '@/components/MainPage.jsx';
import AdminPage from '@/components/AdminPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<MainPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
