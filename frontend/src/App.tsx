import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import MediaGrid from './components/MediaGrid'
import MediaViewer from './components/MediaViewer'
import { LoadingSpinner } from './components/LoadingSpinner'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/viewer" element={<MediaViewer />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

function Home() {
  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container">
      <header>
        <h1>Bird Cam Media</h1>
        <select 
          value={selectedSpecies} 
          onChange={(e) => setSelectedSpecies(e.target.value)}
          disabled={isLoading}
        >
          <option value="">All Species</option>
          <option value="americangoldfinch">American Goldfinch</option>
          <option value="americanrobin">American Robin</option>
          <option value="barnswallow">Barn Swallow</option>
          <option value="black-cappedchickadee">Black-capped Chickadee</option>
          <option value="bluejay">Blue Jay</option>
          <option value="cedarwaxwing">Cedar Waxwing</option>
          <option value="commonstarling">Common Starling</option>
          <option value="downywoodpecker">Downy Woodpecker</option>
          <option value="housefinch">House Finch</option>
          <option value="housesparrow">House Sparrow</option>
          <option value="mourningdove">Mourning Dove</option>
          <option value="northerncardinal">Northern Cardinal</option>
          <option value="redheadedwoodpecker">Red-headed Woodpecker</option>
          <option value="redwingedblackbird">Red-winged Blackbird</option>
        </select>
      </header>

      <div className="content">
        <section>
          <h2>Images</h2>
          <MediaGrid 
            folder="images" 
            filterSpecies={selectedSpecies}
            onLoadingChange={setIsLoading}
          />
        </section>

        <section>
          <h2>Videos</h2>
          <MediaGrid 
            folder="videos" 
            filterSpecies={selectedSpecies}
            onLoadingChange={setIsLoading}
          />
        </section>
      </div>
    </div>
  )
}

export default App 