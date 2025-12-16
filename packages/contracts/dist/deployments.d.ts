import type { Address } from 'viem';
export interface CoreDeployment {
    factory: Address;
    liquidationEngine: Address;
    fundingManager: Address;
    deployer: Address;
    timestamp: number;
}
export interface ExtendedDeployment extends CoreDeployment {
    perpMarketImpl?: Address;
    positionManagerImpl?: Address;
    perpEngineImpl?: Address;
    deploymentBlock?: number;
    usdc?: Address;
}
export type DeploymentConfig = ExtendedDeployment;
export declare function getDeployment(chainId: number): DeploymentConfig | null;
export declare function getDeployments(): Record<string, DeploymentConfig>;
export declare const SUPPORTED_CHAINS: number[];
export declare function isChainSupported(chainId: number): boolean;
//# sourceMappingURL=deployments.d.ts.map