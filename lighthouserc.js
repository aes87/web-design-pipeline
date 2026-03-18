/** @type {import('@lhci/cli').LighthouseConfig} */
export default {
  ci: {
    collect: {
      // URL is set dynamically by the validation pipeline
      numberOfRuns: 1,
      settings: {
        // Limit to performance and accessibility
        onlyCategories: ['performance', 'accessibility'],
        // Skip network-dependent audits (we test locally)
        skipAudits: [
          'uses-http2',
          'uses-long-cache-ttl',
          'canonical',
          'is-crawlable',
        ],
        // Throttle to simulate mid-tier mobile
        throttling: {
          cpuSlowdownMultiplier: 2,
        },
      },
    },
    assert: {
      assertions: {
        // Performance
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'dom-size': ['warn', { maxNumericValue: 800 }],

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Performance score
        'categories:performance': ['warn', { minScore: 0.8 }],
      },
    },
  },
};
