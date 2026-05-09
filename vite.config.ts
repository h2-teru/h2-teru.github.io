import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const getGitHubPagesBase = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }

  const [, repoName] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
  const ownerName = process.env.GITHUB_REPOSITORY_OWNER;
  const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';
  const isUserPage =
    repoName != null &&
    ownerName != null &&
    repoName.toLowerCase() === `${ownerName.toLowerCase()}.github.io`;

  if (isGitHubPagesBuild && repoName != null && !isUserPage) {
    return `/${repoName}/`;
  }

  return '/';
};

export default defineConfig({
  base: getGitHubPagesBase(),
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimizeDeps: {
    force: true,
  },
});
