import { Routes, Route } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { CallbackPage } from './pages/CallbackPage'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
      </Routes>
    </div>
  )
}

export default App
