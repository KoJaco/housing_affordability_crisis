import { HomeIcon } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

type Breadcrumb = {
    label: string;
    href: string;
    isActive: boolean;
    icon?: React.ReactNode;
};

export function Header() {
    const location = useLocation();
    const pathname = location.pathname;

    const breadcrumbs: Breadcrumb[] = [
        {
            label: "Home",
            href: "/",
            isActive: pathname === "/",
            icon: <HomeIcon className="h-4 w-4" />,
        },
    ];

    if (pathname.startsWith("/sydney-suburbs")) {
        breadcrumbs.push({
            label: "Sydney Suburbs",
            href: "/sydney-suburbs",
            isActive: pathname === "/sydney-suburbs",
        });
    }

    return (
        <header className="flex items-center justfiy-start w-full">
            <div className="mx-auto border-b flex max-w-7xl px-4 gap-3 h-[100px] flex-row items-center justify-start w-full">
                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-gray-900">
                        Sydney Property Analysis
                    </h1>

                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    <BreadcrumbItem>
                                        {crumb.icon && (
                                            <span>{crumb.icon}</span>
                                        )}
                                        {crumb.isActive ? (
                                            <BreadcrumbPage>
                                                {crumb.label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link to={crumb.href}>
                                                    {crumb.label}
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {index < breadcrumbs.length - 1 && (
                                        <BreadcrumbSeparator />
                                    )}
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>
        </header>
    );
}
