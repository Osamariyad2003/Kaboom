import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface Props {
  condensedTexts: Record<string, string>;
  isLoading: boolean;
  onCondense: () => void;
  originalTexts: Record<string, string>;
}

export default function TheoreticalBackground({ condensedTexts, isLoading, onCondense, originalTexts }: Props) {
  const [showCondensed, setShowCondensed] = useState(true);

  const orbitalPoints = [
    'The only possible paths orbiting objects can take are conic sections, such as ellipses (Kepler\'s first law).',
    'The sun is located at the focus of the conic orbit.',
    'The orbital motion takes place in a plane that is fixed in space, this plane is referred to as the orbital plane.',
    'The asteroid\'s speed varies with its distance from the sun, but it sweeps out equal areas per unit time (Kepler\'s second law).',
    'Six orbital parameters, called the Keplerian elements, completely define the asteroids orbit.'
  ];

  const displayTexts = showCondensed ? condensedTexts : originalTexts;

  return (
    <section className="bg-white text-black px-24 py-16">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-semibold text-blue-700">Theoretical Background</h3>

        <div className="flex gap-3">
          <button
            onClick={() => setShowCondensed(!showCondensed)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {showCondensed ? 'Show Full Text' : 'Show AI Condensed'}
          </button>

          <button
            onClick={onCondense}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Re-condense with AI
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-purple-600 my-4 bg-purple-50 p-4 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-semibold">Gemini AI is condensing your text...</span>
        </div>
      )}

      {showCondensed && !isLoading && Object.keys(condensedTexts).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-600 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-purple-700 font-semibold">
            <Sparkles className="w-5 h-5" />
            <span>AI-Condensed Version (40-50% shorter)</span>
          </div>
        </div>
      )}

      <p className="mb-4 leading-relaxed">
        {displayTexts.intro || originalTexts.intro}
      </p>
      <p className="mb-4 leading-relaxed">
        {displayTexts.neo || originalTexts.neo}
      </p>
      <p className="mb-4 leading-relaxed">
        {displayTexts.pha || originalTexts.pha}
      </p>
      <p className="mb-4 leading-relaxed">
        {displayTexts.mechanics || originalTexts.mechanics}
      </p>

      <ol className="list-decimal list-inside space-y-2 my-6">
        {orbitalPoints.map((point, index) => (
          <li key={index} className="leading-relaxed">{point}</li>
        ))}
      </ol>

      <div className="text-center my-8">
        <img
          src="https://i.postimg.cc/rsZ14tvf/IMG-4520.jpg"
          alt="Orbital diagram"
          className="inline-block w-64 rounded-lg shadow-lg"
        />
      </div>

      <h3 className="text-3xl font-semibold text-blue-700 mb-6 mt-12">Keplerian Elements</h3>
      <p className="mb-4 leading-relaxed">
        {displayTexts.keplerian || originalTexts.keplerian}
      </p>

      <div className="bg-gray-50 rounded-xl p-6 my-8 text-center shadow-md">
        <div className="text-lg mb-2">
          <p className="mb-4">Trajectory equation in polar coordinates:</p>
          <div className="font-mono bg-white p-4 rounded inline-block">
            r = (h² / μ) / (1 + (B / μ)cos ν)
          </div>
          <p className="text-sm text-gray-600 mt-2">(Equation 1)</p>
        </div>
      </div>

      <p className="mb-4 leading-relaxed">
        <em>r</em> is the distance from the focus (the Sun) to the asteroid, and <em>ν</em> is the true anomaly — the angle between the vector <strong>B</strong> and the vector <strong>r</strong>. Compare this to the general equation of conic sections:
      </p>

      <div className="bg-gray-50 rounded-xl p-6 my-8 text-center shadow-md">
        <div className="text-lg mb-2">
          <div className="font-mono bg-white p-4 rounded inline-block">
            r = p / (1 + e cos ν) = a(1 - e²) / (1 + e cos ν)
          </div>
          <p className="text-sm text-gray-600 mt-2">(Equation 2)</p>
        </div>
      </div>

      <p className="mb-4 leading-relaxed">
        <strong>a</strong> is the semi-major axis (half the longest diameter), determining orbit size. <strong>e</strong> is the eccentricity, describing the shape: 0 = circle, between 0-1 = ellipse. Earth's orbit has e = 0.0167, nearly circular.
      </p>

      <p className="mb-4 leading-relaxed">
        In the simulation below, you can visualize an asteroid's orbit using live NASA API data. Vary the Keplerian elements to see how they affect the orbit.
      </p>
    </section>
  );
}
