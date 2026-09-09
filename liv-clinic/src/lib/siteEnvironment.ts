/** Netlify sets CONTEXT during the build; local production builds stay indexable. */
export function isPreviewDeployment(context = process.env.CONTEXT): boolean {
  return context === 'deploy-preview' || context === 'branch-deploy';
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net').replace(/\/+$/, '');
