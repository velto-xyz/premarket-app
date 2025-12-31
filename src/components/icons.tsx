import { HugeiconsIcon } from "@hugeicons/react";
import {
    Activity01Icon as _Activity01Icon,
    AiImageIcon as _AiImageIcon,
    Analytics02Icon as _Analytics02Icon,
    ArrowRight01Icon as _ArrowRight01Icon,
    ArtificialIntelligence02Icon as _ArtificialIntelligence02Icon,
    BankIcon as _BankIcon,
    BotIcon as _BotIcon,
    Briefcase01Icon as _Briefcase01Icon,
    Building03Icon as _Building03Icon,
    ChampionIcon as _ChampionIcon,
    ChartDecreaseIcon as _ChartDecreaseIcon,
    ChartIncreaseIcon as _ChartIncreaseIcon,
    ComputerIcon as _ComputerIcon,
    CpuIcon as _CpuIcon,
    Database01Icon as _Database01Icon,
    Factory02Icon as _Factory02Icon,
    Globe02Icon as _Globe02Icon,
    Layers01Icon as _Layers01Icon,
    Layout01Icon as _Layout01Icon,
    Leaf01Icon as _Leaf01Icon,
    Location01Icon as _Location01Icon,
    Logout01Icon as _Logout01Icon,
    MenuSquareIcon as _MenuSquareIcon,
    Moon01Icon as _Moon01Icon,
    PaintBoardIcon as _PaintBoardIcon,
    Robot01Icon as _Robot01Icon,
    Rocket01Icon as _Rocket01Icon,
    ServerStack02Icon as _ServerStack02Icon,
    ShoppingBag01Icon as _ShoppingBag01Icon,
    SmartPhone01Icon as _SmartPhone01Icon,
    SparklesIcon as _SparklesIcon,
    Sun01Icon as _Sun01Icon,
    ZapIcon as _ZapIcon,
} from "@hugeicons/core-free-icons";

type HugeIconProps = Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon">;

const createIcon = (icon: any) => (props: HugeIconProps) => (
    <HugeiconsIcon icon={icon} {...props} />
);

export const Activity01Icon = createIcon(_Activity01Icon);
export const AiImageIcon = createIcon(_AiImageIcon);
export const Analytics02Icon = createIcon(_Analytics02Icon);
export const ArrowRight01Icon = createIcon(_ArrowRight01Icon);
export const ArtificialIntelligence02Icon = createIcon(_ArtificialIntelligence02Icon);
export const BankIcon = createIcon(_BankIcon);
export const BotIcon = createIcon(_BotIcon);
export const Briefcase01Icon = createIcon(_Briefcase01Icon);
export const Building03Icon = createIcon(_Building03Icon);
export const ChampionIcon = createIcon(_ChampionIcon);
export const ChartDecreaseIcon = createIcon(_ChartDecreaseIcon);
export const ChartIncreaseIcon = createIcon(_ChartIncreaseIcon);
export const ComputerIcon = createIcon(_ComputerIcon);
export const CpuIcon = createIcon(_CpuIcon);
export const Database01Icon = createIcon(_Database01Icon);
export const Factory02Icon = createIcon(_Factory02Icon);
export const Globe02Icon = createIcon(_Globe02Icon);
export const Layers01Icon = createIcon(_Layers01Icon);
export const Layout01Icon = createIcon(_Layout01Icon);
export const Leaf01Icon = createIcon(_Leaf01Icon);
export const Location01Icon = createIcon(_Location01Icon);
export const Logout01Icon = createIcon(_Logout01Icon);
export const MenuSquareIcon = createIcon(_MenuSquareIcon);
export const Moon01Icon = createIcon(_Moon01Icon);
export const PaintBoardIcon = createIcon(_PaintBoardIcon);
export const Robot01Icon = createIcon(_Robot01Icon);
export const Rocket01Icon = createIcon(_Rocket01Icon);
export const ServerStack02Icon = createIcon(_ServerStack02Icon);
export const ShoppingBag01Icon = createIcon(_ShoppingBag01Icon);
export const SmartPhone01Icon = createIcon(_SmartPhone01Icon);
export const SparklesIcon = createIcon(_SparklesIcon);
export const Sun01Icon = createIcon(_Sun01Icon);
export const ZapIcon = createIcon(_ZapIcon);

export const MarketsIcon = ({ className, strokeWidth = 1.5, ...props }: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) => (
    <svg
        viewBox="0 0 24.1054 29.7422"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <g>
            <path d="M15.4582 15.7464V21.3207H10.1707H5.07049" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M18.0187 7.82742L18.5093 8.67838L23.3554 14.0746V18.3341H19.1127V17.3183L15.8969 15.7465H14.3975C12.649 15.7465 11.2314 14.3256 11.2314 12.5729V11.0238" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M18.3083 7.21289C17.6452 8.11588 16.3303 8.2108 15.5241 7.41398C14.7178 6.61711 14.7939 5.29799 15.6853 4.62053L20.3366 2.40773C20.4277 2.49779 20.4239 2.49404 20.515 2.5841L18.3083 7.21289Z" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M9.37643 5.14406C8.88922 5.4344 4.86846 9.46418 5.07049 21.3207" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M9.37643 5.13287C7.12491 6.07219 2.58278 8.85223 0.812427 16.5325L4.64909 21.3207H5.34723" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M14.2457 21.3207H6.28297V25.2333H14.2457V21.3207Z" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M19.3315 28.9922H1.19716V28.4505C1.19716 26.6737 2.63757 25.2333 4.41442 25.2333H16.1142C17.8911 25.2333 19.3315 26.6737 19.3315 28.4505V28.9922Z" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
            <path d="M14.9649 5.13287H12.7626V0.75C10.8924 0.75 9.37643 2.26963 9.37643 4.14416V5.14406L8.66106 5.87572" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" />
        </g>
    </svg>
);
