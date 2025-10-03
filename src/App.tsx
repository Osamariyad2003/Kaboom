import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import TheoreticalBackground from './components/TheoreticalBackground';
import OrbitSimulation from './components/OrbitSimulation';
import { condenseText } from './services/gemini';

function App() {
  const [isCondensing, setIsCondensing] = useState(false);
  const [condensedSections, setCondensedSections] = useState<Record<string, string>>({});

  const originalTexts = {
    intro: `Large rocky objects that are smaller in size than planets and are in orbit around the sun are called asteroids. Most asteroids are found in a region called the asteroid belt spanning the space between Mars and Jupiter. Occasional collisions between these asteroids, however, create smaller fragments that form the source of near-Earth objects (NEOs).`,

    neo: `Near-Earth objects orbit the sun to within 1.3 AU. The astronomical unit AU is the average distance between the sun and Earth and is about 150 million kilometers. As you might have guessed, near-Earth objects can pose serious threat to Earth with a probability of impacting us! Don't panic though, scientists and astronomers keep tracking near-Earth objects to find them before they find us.`,

    pha: `Near-Earth objects are classified to be potentially hazardous asteroids (PHAs) if they approach Earth's orbit to within 0.05 AU, approximately 7.5 million kilometers, and have diameters greater than 150 meters, roughly three times the length of an Olympic swimming pool.`,

    mechanics: `Perhaps the question now is how can you determine whether or not an asteroid is potentially hazardous? By calculating an asteroids orbit we can determine its position at any time relative to Earth. This can be achieved by applying fundamental concepts from orbital mechanics.`,

    keplerian: `The following is a brief discussion on the Keplerian elements, which we encourage you to read to help you understand how we calculate the asteroid's orbit.`
  };

  const condenseAllTexts = async () => {
    setIsCondensing(true);
    const condensed: Record<string, string> = {};

    for (const [key, text] of Object.entries(originalTexts)) {
      try {
        const result = await condenseText(text);
        condensed[key] = result;
      } catch (error) {
        console.error(`Error condensing ${key}:`, error);
        condensed[key] = text;
      }
    }

    setCondensedSections(condensed);
    setIsCondensing(false);
  };

  useEffect(() => {
    condenseAllTexts();
  }, []);

  return (
    <div className="font-montserrat bg-white text-black">
      <Header />
      <Hero />
      <Features />
      <TheoreticalBackground
        condensedTexts={condensedSections}
        isLoading={isCondensing}
        onCondense={condenseAllTexts}
        originalTexts={originalTexts}
      />
      <OrbitSimulation />
    </div>
  );
}

export default App;
