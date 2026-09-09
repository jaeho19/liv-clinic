/** Preserve the build's indexing policy during Netlify SSR/ISR as well. */
export function isPreviewDeployment(context = process.env.LIV_BUILD_CONTEXT || process.env.CONTEXT): boolean {
  return context === 'deploy-preview' || context === 'branch-deploy';
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net').replace(/\/+$/, '');
