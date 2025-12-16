import rawDeployments from '../deployments.json';
const deployments = rawDeployments;
export function getDeployment(chainId) {
    return deployments[chainId.toString()] || null;
}
export function getDeployments() {
    return deployments;
}
export const SUPPORTED_CHAINS = Object.keys(deployments).map(Number);
export function isChainSupported(chainId) {
    return chainId.toString() in deployments;
}
