/**
 * pages/Components/LP Comps/AlertDialog.tsx
 * Custom Radix-like AlertDialog components built with Framer Motion 
 * and Tailwind CSS.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

interface AlertDialogContextType {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined);

interface AlertDialogProps {
    children: React.ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
    children,
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
}) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
        if (!isControlled) {
            setUncontrolledOpen(value);
        }
        if (onOpenChange) {
            const newValue = typeof value === "function" ? value(open) : value;
            onOpenChange(newValue);
        }
    }, [isControlled, onOpenChange, open]);

    return (
        <AlertDialogContext.Provider value={{ open, setOpen }}>
            {children}
        </AlertDialogContext.Provider>
    );
};

interface AlertDialogTriggerProps {
    children: React.ReactNode;
    asChild?: boolean;
}

const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ children, asChild = false, ...props }, ref) => {
        const context = React.useContext(AlertDialogContext);
        if (!context) {
            throw new Error("AlertDialogTrigger must be used within an AlertDialog");
        }

        const { setOpen } = context;

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            setOpen(true);

            // Call the original onClick if it exists
            if (props.onClick) {
                props.onClick(e);
            }
        };

        // Remove onClick from props to avoid duplicate handlers
        const { onClick, ...otherProps } = props;

        if (asChild) {
            return (
                <>
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            const element = child as React.ReactElement<any>;
                            return React.cloneElement(element, {
                                ...element.props,
                                ref,
                                onClick: handleClick
                            });
                        }
                        return child;
                    })}
                </>
            );
        }

        return (
            <button
                ref={ref}
                type="button"
                onClick={handleClick}
                {...otherProps}
            >
                {children}
            </button>
        );
    }
);
AlertDialogTrigger.displayName = "AlertDialogTrigger";

import * as ReactDOM from "react-dom";

const AlertDialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return ReactDOM.createPortal(children, document.body);
};

const AlertDialogOverlay = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "fixed inset-0 z-50 bg-black/80 blur-[2px]",
                className
            )}
            {...Object.keys(props).reduce((acc: { [key: string]: any }, key) => {
                if (key.startsWith('onDrag') || key === 'onAnimationStart' || key === 'onTransitionEnd') {
                    return acc;
                }
                acc[key] = (props as any)[key];
                return acc;
            }, {})}
        />
    );
});
AlertDialogOverlay.displayName = "AlertDialogOverlay";

const AlertDialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
        throw new Error("AlertDialogContent must be used within an AlertDialog");
    }

    const { open, setOpen } = context;
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [open, setOpen]);

    return (
        <AnimatePresence>
            {open && (
                <AlertDialogPortal>
                    <AlertDialogOverlay />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            ref={(node) => {
                                if (typeof ref === "function") ref(node);
                                else if (ref) ref.current = node;
                                (contentRef as any).current = node;
                            }}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={cn(
                                "flex flex-col gap-2 pointer-events-auto relative w-full max-w-lg overflow-hidden border bg-background p-6 shadow-2xl sm:rounded-3xl",
                                className
                            )}
                            // Filter out properties that conflict with Framer Motion's types
                            {...Object.keys(props).reduce((acc: { [key: string]: any }, key) => {
                                if (key.startsWith('onDrag') || key === 'onAnimationStart' || key === 'onTransitionEnd') {
                                    return acc;
                                }
                                acc[key] = (props as any)[key];
                                return acc;
                            }, {})}
                        >
                            {children}
                        </motion.div>
                    </div>
                </AlertDialogPortal>
            )}
        </AnimatePresence>
    );
});
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-2 text-center sm:text-left",
            className
        )}
        {...props}
    />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn("text-lg font-semibold", className)}
        {...props}
    />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
AlertDialogDescription.displayName = "AlertDialogDescription";

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

const AlertDialogAction = React.forwardRef<
    HTMLButtonElement,
    AlertDialogActionProps
>(({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
        throw new Error("AlertDialogAction must be used within an AlertDialog");
    }

    const { setOpen } = context;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setOpen(false);

        // Call the original onClick if it exists
        if (props.onClick) {
            props.onClick(e);
        }
    };

    // Remove onClick from props to avoid duplicate handlers
    const { onClick, ...otherProps } = props;

    return (
        <button
            ref={ref}
            className={cn(buttonVariants(), className)}
            onClick={handleClick}
            {...otherProps}
        />
    );
});
AlertDialogAction.displayName = "AlertDialogAction";

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

const AlertDialogCancel = React.forwardRef<
    HTMLButtonElement,
    AlertDialogCancelProps
>(({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
        throw new Error("AlertDialogCancel must be used within an AlertDialog");
    }

    const { setOpen } = context;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setOpen(false);

        // Call the original onClick if it exists
        if (props.onClick) {
            props.onClick(e);
        }
    };

    // Remove onClick from props to avoid duplicate handlers
    const { onClick, ...otherProps } = props;

    return (
        <button
            ref={ref}
            className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 sm:mt-0",
                className
            )}
            onClick={handleClick}
            {...otherProps}
        />
    );
});
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
