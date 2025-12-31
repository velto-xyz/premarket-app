import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectWalletProps {
    isCollapsed?: boolean;
}

export const ConnectWallet = ({ isCollapsed }: ConnectWalletProps) => {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <Button
                                        onClick={openConnectModal}
                                        type="button"
                                        className={cn(
                                            "w-full rounded-2xl font-bold transition-all duration-300",
                                            isCollapsed ? "h-10 w-10 p-0" : "px-4"
                                        )}
                                    >
                                        {isCollapsed ? (
                                            <Wallet className="h-5 w-5" />
                                        ) : (
                                            "Connect Wallet"
                                        )}
                                    </Button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <Button
                                        onClick={openChainModal}
                                        type="button"
                                        variant="destructive"
                                        className={cn(
                                            "w-full rounded-2xl font-bold",
                                            isCollapsed ? "h-10 w-10 p-0" : "px-4"
                                        )}
                                    >
                                        {isCollapsed ? "!" : "Wrong Network"}
                                    </Button>
                                );
                            }

                            return (
                                <div className="flex flex-col gap-2 w-full">
                                    <Button
                                        onClick={openAccountModal}
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "w-full rounded-2xl font-mono border-border-default/50 hover:bg-muted/50 transition-all duration-300",
                                            isCollapsed ? "h-10 w-10 p-0" : "px-4"
                                        )}
                                    >
                                        {isCollapsed ? (
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                                                {account.displayName.slice(0, 2)}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full bg-primary" />
                                                <span>{account.displayName}</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};
