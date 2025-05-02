import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Layout } from './presentation/layouts/Layout'
import { Dashboard } from './presentation/pages/Dashboard'
import { Profile } from './presentation/pages/Profile'
import { SocialMedia } from './presentation/pages/SocialMedia'
import { Documents } from './presentation/pages/Documents'
import { Events } from './presentation/pages/Events'
import { Settings } from './presentation/pages/Settings'

function App() {
  return (
    <Box minH="100vh">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/social-media" element={<SocialMedia />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/events" element={<Events />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App
