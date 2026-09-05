export interface BenchmarkTarget {
	key: string
	label: string
	url: string
}
export const benchmarkTargets: BenchmarkTarget[] = [
	{ key: 'google', label: 'Google', url: 'https://www.google.com' },
	{ key: 'youtube', label: 'YouTube', url: 'https://www.youtube.com' },
	{ key: 'gmail', label: 'Gmail', url: 'https://mail.google.com' },
	{ key: 'google-drive', label: 'Google Drive', url: 'https://drive.google.com' },

	{ key: 'bing', label: 'Bing', url: 'https://www.bing.com' },
	{ key: 'duckduckgo', label: 'DuckDuckGo', url: 'https://duckduckgo.com' },

	{ key: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com' },
	{ key: 'claude', label: 'Claude', url: 'https://claude.ai' },
	{ key: 'gemini', label: 'Gemini', url: 'https://gemini.google.com' },
	{ key: 'copilot', label: 'Microsoft Copilot', url: 'https://copilot.microsoft.com' },
	{ key: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai' },

	{ key: 'github', label: 'GitHub', url: 'https://github.com' },
	{ key: 'stackoverflow', label: 'Stack Overflow', url: 'https://stackoverflow.com' },
	{ key: 'npm', label: 'npm', url: 'https://www.npmjs.com' },

	{ key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com' },
	{ key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com' },
	{ key: 'twitter', label: 'X (Twitter)', url: 'https://x.com' },
	{ key: 'reddit', label: 'Reddit', url: 'https://www.reddit.com' },
	{ key: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com' },
	{ key: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com' },

	{ key: 'netflix', label: 'Netflix', url: 'https://www.netflix.com' },
	{ key: 'spotify', label: 'Spotify', url: 'https://open.spotify.com' },
	{ key: 'twitch', label: 'Twitch', url: 'https://www.twitch.tv' },

	{ key: 'amazon', label: 'Amazon', url: 'https://www.amazon.com' },
	{ key: 'cloudflare', label: 'Cloudflare', url: 'https://www.cloudflare.com' },
	{
		key: 'cloudflare-speed',
		label: 'Cloudflare Speed Test',
		url: 'https://speed.cloudflare.com',
	},
	{ key: 'fast', label: 'Fast.com', url: 'https://fast.com' },

	{ key: 'wikipedia', label: 'Wikipedia', url: 'https://www.wikipedia.org' },
	{ key: 'apple', label: 'Apple', url: 'https://www.apple.com' },
	{ key: 'microsoft', label: 'Microsoft', url: 'https://www.microsoft.com' },
]
export const CUSTOM_BENCHMARK_TARGET_KEY = 'custom'
