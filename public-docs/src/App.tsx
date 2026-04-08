import { useState } from 'react'
import type { Lang } from './translations'
import IntroScreen from './components/IntroScreen'
import FlowchartView from './components/FlowchartView'

type View = 'intro' | 'flowchart'

function App() {
  const [view, setView] = useState<View>('intro')
  const [lang, setLang] = useState<Lang>('en')

  if (view === 'flowchart') {
    return (
      <FlowchartView
        lang={lang}
        onLangChange={setLang}
        onBack={() => setView('intro')}
      />
    )
  }

  return (
    <IntroScreen
      lang={lang}
      onLangChange={setLang}
      onViewWorkflow={() => setView('flowchart')}
    />
  )
}

export default App
