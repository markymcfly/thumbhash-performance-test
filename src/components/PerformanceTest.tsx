// src/components/PerformanceTest.tsx
import { useRef, useState } from 'react';
import { CanvasImage } from './CanvasImage';
import { WrapperImage } from './WrapperImage';
import { SAMPLE_IMAGES } from '../data/sampleImages';

type TestMethod = 'canvas' | 'wrapper' | null;

interface TestResults {
  method: string;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  renderCount: number;
  times: number[];
}

export function PerformanceTest() {
  const [testMethod, setTestMethod] = useState<TestMethod>(null);
  const [imageCount, setImageCount] = useState(100);
  const [canvasResults, setCanvasResults] = useState<TestResults | null>(null);
  const [wrapperResults, setWrapperResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const renderTimesRef = useRef<number[]>([]);

  const handleRenderComplete = (time: number) => {
    renderTimesRef.current.push(time);
  };

  const startTest = (method: TestMethod) => {
    if (!method) return;

    setIsRunning(true);
    setTestMethod(method);
    renderTimesRef.current = [];

    // Wait for renders to complete
    setTimeout(() => {
      const results = calculateResults(method, renderTimesRef.current);

      if (method === 'canvas') {
        setCanvasResults(results);
      } else {
        setWrapperResults(results);
      }

      setIsRunning(false);
      setTestMethod(null);
    }, 1000); // Wait 1s for all renders
  };

  const calculateResults = (method: string, times: number[]): TestResults => {
    const validTimes = times.filter(t => t > 0);
    const totalTime = validTimes.reduce((sum, t) => sum + t, 0);
    const avgTime = totalTime / validTimes.length;
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);

    return {
      method: method === 'canvas' ? 'Canvas' : '::before Wrapper',
      totalTime,
      avgTime,
      minTime,
      maxTime,
      renderCount: validTimes.length,
      times: validTimes,
    };
  };

  const clearResults = () => {
    setCanvasResults(null);
    setWrapperResults(null);
    setTestMethod(null);
    renderTimesRef.current = [];
  };

  const getWinner = () => {
    if (!canvasResults || !wrapperResults) return null;

    const canvasFaster = canvasResults.totalTime < wrapperResults.totalTime;
    const diff = Math.abs(canvasResults.totalTime - wrapperResults.totalTime);
    const slower = canvasFaster ? wrapperResults.totalTime : canvasResults.totalTime;
    const percent = ((diff / slower) * 100).toFixed(1);

    return {
      winner: canvasFaster ? 'Canvas' : '::before',
      loser: canvasFaster ? '::before' : 'Canvas',
      diff: diff.toFixed(2),
      percent,
      speedup: (slower / Math.min(canvasResults.totalTime, wrapperResults.totalTime)).toFixed(2),
    };
  };

  const imagesToRender = SAMPLE_IMAGES.slice(0, imageCount);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-gray-600 text-4xl font-bold mb-2">ThumbHash Performance Test</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

          <div className="flex items-center gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anzahl Bilder: {imageCount}
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={imageCount}
                onChange={(e) => setImageCount(parseInt(e.target.value))}
                className="w-64"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => startTest('canvas')}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isRunning && testMethod === 'canvas' ? 'Testing Canvas...' : 'Test Canvas'}
            </button>

            <button
              onClick={() => startTest('wrapper')}
              disabled={isRunning}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isRunning && testMethod === 'wrapper' ? 'Testing ::before...' : 'Test ::before'}
            </button>

            <button
              onClick={clearResults}
              disabled={isRunning}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Results */}
        {(canvasResults || wrapperResults) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {canvasResults && (
              <ResultCard results={canvasResults} color="blue" />
            )}
            {wrapperResults && (
              <ResultCard results={wrapperResults} color="purple" />
            )}
          </div>
        )}

        {/* Winner */}
        {canvasResults && wrapperResults && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-bold mb-3 text-green-900">
              🏆 Winner: {getWinner()?.winner}
            </h3>
            <p className="text-lg text-green-800">
              <strong>{getWinner()?.winner}</strong> ist{' '}
              <strong className="text-2xl">{getWinner()?.diff}ms ({getWinner()?.percent}%)</strong>{' '}
              schneller als {getWinner()?.loser}!
            </p>
            <p className="text-md text-green-700 mt-2">
              Speedup-Faktor: <strong>{getWinner()?.speedup}x</strong>
            </p>
          </div>
        )}

        {/* Visual Test Area */}
        {testMethod && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Testing: {testMethod === 'canvas' ? 'Canvas' : '::before Wrapper'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {imagesToRender.map((image) => (
                testMethod === 'canvas' ? (
                  <CanvasImage
                    key={image.id}
                    thumbHash={image.thumbHash}
                    alt={`Image ${image.id}`}
                    imageUrl={image.url}
                    onRenderComplete={handleRenderComplete}
                  />
                ) : (
                  <WrapperImage
                    key={image.id}
                    thumbHash={image.thumbHash}
                    alt={`Image ${image.id}`}
                    imageUrl={image.url}
                    onRenderComplete={handleRenderComplete}
                  />
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Result Card Component
function ResultCard({ results, color }: { results: TestResults; color: 'blue' | 'purple' }) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      accent: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      accent: 'text-purple-600',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} border-2 ${classes.border} rounded-lg p-6`}>
      <h3 className={`text-2xl font-bold mb-4 ${classes.text}`}>
        {results.method}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <MetricBox
          label="Total Time"
          value={`${results.totalTime.toFixed(2)}ms`}
          colorClass={classes.accent}
        />
        <MetricBox
          label="Avg Render"
          value={`${results.avgTime.toFixed(2)}ms`}
          colorClass={classes.accent}
        />
        <MetricBox
          label="Min Time"
          value={`${results.minTime.toFixed(2)}ms`}
          colorClass={classes.accent}
        />
        <MetricBox
          label="Max Time"
          value={`${results.maxTime.toFixed(2)}ms`}
          colorClass={classes.accent}
        />
      </div>

      {/* <div className="mt-4 pt-4 border-t border-gray-300">
        <p className="text-sm text-gray-600">
          Rendered: <strong>{results.renderCount}</strong> images
        </p>
      </div> */}
    </div>
  );
}

function MetricBox({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}