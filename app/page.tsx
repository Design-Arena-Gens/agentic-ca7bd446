'use client';

import { useState } from 'react';
import { MarketingResponse } from '@/lib/types';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketingResponse | null>(null);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    product_name: '',
    niche: '',
    landing_url: '',
    product_file_s3_url: '',
    max_images: 5,
    variants_per_platform: 3,
  });

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let fileBase64 = '';
      let fileType = '';

      if (file) {
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        fileBase64 = fileData;
        fileType = file.type || 'text/plain';
      }

      const requestBody = {
        product_id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        product_name: formData.product_name,
        landing_url: formData.landing_url,
        niche: formData.niche,
        max_images: formData.max_images,
        variants_per_platform: formData.variants_per_platform,
        human_review_required: true,
        product_file_s3_url: formData.product_file_s3_url || undefined,
        product_file_base64: fileBase64 || undefined,
        product_file_type: fileType || undefined,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadAssets = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-assets-${result.product_id}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Organic Marketing Agent
          </h1>
          <p className="text-xl text-gray-600">
            Generate viral-ready marketing assets for all platforms
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Product Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  placeholder="e.g., Ultimate SEO Course"
                />
              </div>

              <div>
                <label className="label">Niche *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.niche}
                  onChange={(e) =>
                    setFormData({ ...formData, niche: e.target.value })
                  }
                  placeholder="e.g., Digital Marketing, SaaS, E-learning"
                />
              </div>

              <div>
                <label className="label">Landing URL *</label>
                <input
                  type="url"
                  required
                  className="input-field"
                  value={formData.landing_url}
                  onChange={(e) =>
                    setFormData({ ...formData, landing_url: e.target.value })
                  }
                  placeholder="https://yourproduct.com"
                />
              </div>

              <div>
                <label className="label">Product File (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.zip"
                  className="input-field"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload PDF, TXT, or ZIP file describing your product
                </p>
              </div>

              <div>
                <label className="label">
                  S3 URL (Alternative to file upload)
                </label>
                <input
                  type="url"
                  className="input-field"
                  value={formData.product_file_s3_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      product_file_s3_url: e.target.value,
                    })
                  }
                  placeholder="https://s3.amazonaws.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Images per Platform</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input-field"
                    value={formData.max_images}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_images: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="label">Variants per Platform</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="input-field"
                    value={formData.variants_per_platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        variants_per_platform: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Assets...' : 'Generate Marketing Assets'}
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
            </form>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Results</h2>
            {!result && !loading && (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Submit the form to generate marketing assets</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your marketing assets...</p>
                <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  <button onClick={downloadAssets} className="btn-secondary">
                    Download JSON
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Generated Assets
                  </h3>
                  <p className="text-blue-700">
                    {result.assets.length} marketing assets across{' '}
                    {new Set(result.assets.map((a) => a.platform)).size} platforms
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-4">
                  {result.assets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-lg capitalize">
                          {asset.platform}
                        </span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          Variant {asset.variant_index}
                        </span>
                      </div>

                      {asset.image_url && (
                        <img
                          src={asset.image_url}
                          alt="Generated marketing image"
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div className="space-y-2 text-sm">
                        <div>
                          <strong className="text-gray-700">Caption:</strong>
                          <p className="text-gray-600 mt-1">{asset.caption}</p>
                        </div>

                        <div>
                          <strong className="text-gray-700">Hashtags:</strong>
                          <p className="text-blue-600 mt-1">
                            {asset.hashtags.map((h) => `#${h}`).join(' ')}
                          </p>
                        </div>

                        <div>
                          <strong className="text-gray-700">Image Prompt:</strong>
                          <p className="text-gray-600 mt-1 text-xs italic">
                            {asset.image_prompt}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-gray-600">
                            <strong>CTA:</strong> {asset.cta}
                          </span>
                          <span className="text-gray-600">
                            Score: {asset.engagement_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>
            Powered by AI • Generate ready-to-post marketing assets for Twitter,
            Pinterest, Instagram, LinkedIn & Reddit
          </p>
        </footer>
      </div>
    </div>
  );
}
